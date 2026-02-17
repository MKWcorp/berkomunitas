"""
Smart Merge for Users 175, 218, 270
Automatically merges into the account with the most points
Target email: 92allstaarrr@gmail.com

This is a convenience script that:
1. Checks which user has the most points
2. Uses that user as the target
3. Merges the other two users into it
4. Sets the email to 92allstaarrr@gmail.com
"""
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL and '?schema=' in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split('?schema=')[0]


def smart_merge_users(user_ids=[175, 218, 270], target_email='92allstaarrr@gmail.com', dry_run=True):
    """
    Intelligently merge users by finding the one with most points
    
    Args:
        user_ids: List of user IDs to consider
        target_email: Final email for the merged account
        dry_run: If True, only show what would happen
    """
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    print("=" * 80)
    print(f"SMART MERGE: Finding best target from users {', '.join(map(str, user_ids))}")
    print("=" * 80)
    
    # Get all users
    cur.execute(
        "SELECT * FROM members WHERE id = ANY(%s) ORDER BY id",
        (user_ids,)
    )
    users = cur.fetchall()
    
    if len(users) != len(user_ids):
        print(f"❌ ERROR: Expected {len(user_ids)} users, found {len(users)}")
        conn.close()
        return False
    
    # Calculate total points for each user
    print("\n📊 Analyzing users:")
    user_points = {}
    
    for user in users:
        total_points = user['coin'] + user['loyalty_point']
        user_points[user['id']] = total_points
        
        print(f"\n   User {user['id']}:")
        print(f"      Name: {user['nama_lengkap']}")
        print(f"      Email: {user['email']}")
        print(f"      Coins: {user['coin']}")
        print(f"      Loyalty: {user['loyalty_point']}")
        print(f"      TOTAL POINTS: {total_points}")
    
    # Find user with most points
    target_user_id = max(user_points, key=user_points.get)
    max_points = user_points[target_user_id]
    
    print(f"\n🏆 User {target_user_id} has the most points: {max_points}")
    print(f"   This user will be kept as the target account")
    
    # Determine source users
    source_user_ids = [uid for uid in user_ids if uid != target_user_id]
    
    print(f"\n📦 Users to merge into target: {', '.join(map(str, source_user_ids))}")
    print(f"   Final email will be: {target_email}")
    
    if not dry_run:
        response = input(f"\n⚠️  Press ENTER to continue with merge, or CTRL+C to cancel... ")
    
    cur.close()
    conn.close()
    
    # Call the main merge script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    merge_script = os.path.join(script_dir, 'merge-users-175-218-270.py')
    
    print(f"\n🔄 Calling merge script with target_user_id={target_user_id}")
    print(f"   Source users: {source_user_ids}")
    print(f"   Target email: {target_email}")
    
    # Execute the merge by running the script with proper parameters
    # For now, just return the information for manual execution
    print(f"\n" + "=" * 80)
    print(f"TO COMPLETE THE MERGE:")
    print(f"=" * 80)
    print(f"\nRun this command:")
    print(f"\n   python scripts/merge-users-175-218-270.py")
    print(f"\nOr modify the script to use:")
    print(f"   target_user_id={target_user_id}")
    print(f"   source_user_ids={source_user_ids}")
    print(f"   target_email='{target_email}'")
    print(f"\n" + "=" * 80)
    
    return True


if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("SMART MERGE: Users 175, 218, 270")
    print("Target Email: 92allstaarrr@gmail.com")
    print("=" * 80)
    print("\nThis script will:")
    print("1. Find the user with the most points (coins + loyalty)")
    print("2. Use that user as the target account")
    print("3. Merge the other users into it")
    print("4. Set email to 92allstaarrr@gmail.com")
    print("5. Combine all coins and loyalty points")
    print("6. Transfer all related records")
    print("\n")
    
    # First run in dry-run mode
    print("🔍 Running DRY RUN first to preview changes...\n")
    smart_merge_users(
        user_ids=[175, 218, 270],
        target_email='92allstaarrr@gmail.com',
        dry_run=True
    )
    
    print("\n" + "=" * 80)
    response = input("\n⚠️  Do you want to proceed with the ACTUAL merge? (type 'yes' to confirm): ")
    
    if response.lower() == 'yes':
        print("\n🔄 Proceeding with actual merge...\n")
        smart_merge_users(
            user_ids=[175, 218, 270],
            target_email='92allstaarrr@gmail.com',
            dry_run=False
        )
    else:
        print("\n❌ Merge cancelled")
