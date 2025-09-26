-- BC Verification Auto-Sync Database Trigger
-- This trigger automatically creates verified data when BC connection is verified

-- 1. Create function to sync BC verified data
CREATE OR REPLACE FUNCTION sync_bc_verified_data()
RETURNS TRIGGER AS $$
DECLARE
    api_record bc_drwskincare_api%ROWTYPE;
    member_record members%ROWTYPE;
BEGIN
    -- Log trigger execution for debugging
    RAISE NOTICE 'BC Verification Trigger: Processing connection ID % with status %', NEW.id, NEW.verification_status;
    
    -- Only process when verification_status changes to 'verified'
    IF NEW.verification_status = 'verified' AND (OLD.verification_status IS NULL OR OLD.verification_status != 'verified') THEN
        
        -- Get API data for this BC connection
        SELECT * INTO api_record 
        FROM bc_drwskincare_api 
        WHERE resellerId = NEW.reseller_id;
        
        -- Get member data
        SELECT * INTO member_record
        FROM members
        WHERE id = NEW.member_id;
        
        -- Check if we have the required data
        IF api_record IS NULL THEN
            RAISE WARNING 'BC Verification Trigger: No API data found for reseller_id %', NEW.reseller_id;
            RETURN NEW;
        END IF;
        
        IF member_record IS NULL THEN
            RAISE WARNING 'BC Verification Trigger: No member data found for member_id %', NEW.member_id;
            RETURN NEW;
        END IF;
        
        -- Create or update verified record
        INSERT INTO bc_drwskincare_plus_verified (
            api_data_id,
            connection_id,
            nama,
            nomor_hp,
            area,
            desa,
            kecamatan,
            kabupaten,
            propinsi,
            kode_pos,
            instagram_link,
            facebook_link,
            tiktok_link,
            created_at,
            updated_at
        ) VALUES (
            api_record.id,
            NEW.id,
            COALESCE(api_record.nama_reseller, member_record.nama_lengkap, 'Unknown'),
            api_record.nomor_hp,
            api_record.area,
            NULL, -- Address details initially empty, user can edit later
            NULL,
            NULL,
            NULL,
            NULL,
            NULL, -- Social media initially empty, user can edit later
            NULL,
            NULL,
            NOW(),
            NOW()
        )
        ON CONFLICT (connection_id) DO UPDATE SET
            -- Update existing record if connection_id already exists
            nama = COALESCE(api_record.nama_reseller, member_record.nama_lengkap, 'Unknown'),
            nomor_hp = api_record.nomor_hp,
            area = api_record.area,
            updated_at = NOW();
        
        RAISE NOTICE 'BC Verification Trigger: Successfully synced verified data for connection %', NEW.id;
        
    END IF;
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the main operation
        RAISE WARNING 'BC Verification Trigger ERROR for connection %: % %', NEW.id, SQLSTATE, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger on bc_drwskincare_plus table
DROP TRIGGER IF EXISTS trigger_sync_bc_verified ON bc_drwskincare_plus;

CREATE TRIGGER trigger_sync_bc_verified
    AFTER INSERT OR UPDATE ON bc_drwskincare_plus
    FOR EACH ROW
    EXECUTE FUNCTION sync_bc_verified_data();

-- 3. Create function to handle API data changes (optional - for future updates)
CREATE OR REPLACE FUNCTION sync_bc_api_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Update verified data when API data changes
    UPDATE bc_drwskincare_plus_verified 
    SET 
        nama = COALESCE(NEW.nama_reseller, nama),
        nomor_hp = COALESCE(NEW.nomor_hp, nomor_hp),
        area = COALESCE(NEW.area, area),
        updated_at = NOW()
    WHERE api_data_id = NEW.id;
    
    RAISE NOTICE 'BC API Trigger: Updated verified data for API ID %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'BC API Trigger ERROR for API ID %: % %', NEW.id, SQLSTATE, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger on bc_drwskincare_api table (optional)
DROP TRIGGER IF EXISTS trigger_sync_bc_api_changes ON bc_drwskincare_api;

CREATE TRIGGER trigger_sync_bc_api_changes
    AFTER UPDATE ON bc_drwskincare_api
    FOR EACH ROW
    WHEN (OLD.nama_reseller IS DISTINCT FROM NEW.nama_reseller 
          OR OLD.nomor_hp IS DISTINCT FROM NEW.nomor_hp 
          OR OLD.area IS DISTINCT FROM NEW.area)
    EXECUTE FUNCTION sync_bc_api_changes();

-- 5. Create function to backfill existing verified connections
CREATE OR REPLACE FUNCTION backfill_verified_data()
RETURNS TABLE(
    connection_id INTEGER,
    status TEXT,
    message TEXT
) AS $$
DECLARE
    conn_record RECORD;
    api_record bc_drwskincare_api%ROWTYPE;
    member_record members%ROWTYPE;
    result_status TEXT;
    result_message TEXT;
BEGIN
    -- Process all verified connections that don't have verified data yet
    FOR conn_record IN 
        SELECT bc.* 
        FROM bc_drwskincare_plus bc
        LEFT JOIN bc_drwskincare_plus_verified bv ON bv.connection_id = bc.id
        WHERE bc.verification_status = 'verified' 
        AND bv.id IS NULL
    LOOP
        BEGIN
            -- Get API data
            SELECT * INTO api_record 
            FROM bc_drwskincare_api 
            WHERE resellerId = conn_record.reseller_id;
            
            -- Get member data
            SELECT * INTO member_record
            FROM members
            WHERE id = conn_record.member_id;
            
            IF api_record IS NULL THEN
                result_status := 'ERROR';
                result_message := 'No API data found';
            ELSIF member_record IS NULL THEN
                result_status := 'ERROR';
                result_message := 'No member data found';
            ELSE
                -- Create verified record
                INSERT INTO bc_drwskincare_plus_verified (
                    api_data_id,
                    connection_id,
                    nama,
                    nomor_hp,
                    area,
                    created_at,
                    updated_at
                ) VALUES (
                    api_record.id,
                    conn_record.id,
                    COALESCE(api_record.nama_reseller, member_record.nama_lengkap, 'Unknown'),
                    api_record.nomor_hp,
                    api_record.area,
                    NOW(),
                    NOW()
                );
                
                result_status := 'SUCCESS';
                result_message := 'Verified data created';
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                result_status := 'ERROR';
                result_message := SQLSTATE || ': ' || SQLERRM;
        END;
        
        -- Return result for this connection
        connection_id := conn_record.id;
        status := result_status;
        message := result_message;
        RETURN NEXT;
        
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- 6. Create maintenance function to check data consistency
CREATE OR REPLACE FUNCTION check_bc_data_consistency()
RETURNS TABLE(
    issue_type TEXT,
    connection_id INTEGER,
    reseller_id TEXT,
    description TEXT
) AS $$
BEGIN
    -- Check for verified connections without verified data
    RETURN QUERY
    SELECT 
        'MISSING_VERIFIED_DATA'::TEXT as issue_type,
        bc.id as connection_id,
        bc.reseller_id,
        'Verified connection missing verified data record'::TEXT as description
    FROM bc_drwskincare_plus bc
    LEFT JOIN bc_drwskincare_plus_verified bv ON bv.connection_id = bc.id
    WHERE bc.verification_status = 'verified' AND bv.id IS NULL;
    
    -- Check for verified data without API data
    RETURN QUERY
    SELECT 
        'MISSING_API_DATA'::TEXT as issue_type,
        bv.connection_id,
        bc.reseller_id,
        'Verified data exists but API data missing'::TEXT as description
    FROM bc_drwskincare_plus_verified bv
    JOIN bc_drwskincare_plus bc ON bc.id = bv.connection_id
    LEFT JOIN bc_drwskincare_api api ON api.id = bv.api_data_id
    WHERE api.id IS NULL;
    
    -- Check for data mismatches
    RETURN QUERY
    SELECT 
        'DATA_MISMATCH'::TEXT as issue_type,
        bv.connection_id,
        bc.reseller_id,
        'Data mismatch between API and verified records'::TEXT as description
    FROM bc_drwskincare_plus_verified bv
    JOIN bc_drwskincare_plus bc ON bc.id = bv.connection_id
    JOIN bc_drwskincare_api api ON api.id = bv.api_data_id
    WHERE bv.nama != COALESCE(api.nama_reseller, bv.nama)
       OR bv.nomor_hp != COALESCE(api.nomor_hp, bv.nomor_hp)
       OR bv.area != COALESCE(api.area, bv.area);
    
    RETURN;
END;
$$ LANGUAGE plpgsql;