/**
 * Test file for Clerk Webhook Handler - Multi-Email Support
 * Run with: node scripts/test-webhook.js
 */

// Mock Clerk webhook payloads for testing
const mockWebhookPayloads = {
  userCreated: {
    type: "user.created",
    data: {
      id: "user_2example123",
      email_addresses: [
        {
          id: "idn_123",
          email_address: "john.doe@example.com",
          verification: {
            status: "verified"
          }
        },
        {
          id: "idn_456",
          email_address: "john.work@example.com",
          verification: {
            status: "unverified"
          }
        }
      ],
      first_name: "John",
      last_name: "Doe"
    }
  },

  userUpdated: {
    type: "user.updated",
    data: {
      id: "user_2example123",
      email_addresses: [
        {
          id: "idn_123",
          email_address: "john.doe@example.com",
          verification: {
            status: "verified"
          }
        },
        {
          id: "idn_789",
          email_address: "john.personal@example.com",
          verification: {
            status: "verified"
          }
        }
      ],
      first_name: "John",
      last_name: "Smith" // Name changed
    }
  },

  userDeleted: {
    type: "user.deleted",
    data: {
      id: "user_2example123"
    }
  }
};

console.log("🧪 Clerk Webhook Test Payloads");
console.log("=====================================");

console.log("\n1️⃣ User Created Event:");
console.log(JSON.stringify(mockWebhookPayloads.userCreated, null, 2));

console.log("\n2️⃣ User Updated Event:");
console.log(JSON.stringify(mockWebhookPayloads.userUpdated, null, 2));

console.log("\n3️⃣ User Deleted Event:");
console.log(JSON.stringify(mockWebhookPayloads.userDeleted, null, 2));

console.log("\n✅ Test payloads generated successfully!");
console.log("Use these payloads to test your webhook endpoint at:");
console.log("POST http://localhost:3000/api/webhooks/clerk");

// Expected database changes for each event
console.log("\n📊 Expected Database Changes:");
console.log("=====================================");

console.log("\n🆕 After user.created:");
console.log("members table: 1 new record with clerk_id='user_2example123'");
console.log("member_emails table: 2 new records");
console.log("  - john.doe@example.com (primary=true, verified=true)");
console.log("  - john.work@example.com (primary=false, verified=false)");
console.log("user_privileges table: 1 new record with privilege='user'");

console.log("\n🔄 After user.updated:");
console.log("members table: nama_lengkap updated to 'John Smith'");
console.log("member_emails table changes:");
console.log("  - john.doe@example.com (kept, still primary=true)");
console.log("  - john.work@example.com (removed)");
console.log("  - john.personal@example.com (added, primary=false)");

console.log("\n🗑️ After user.deleted:");
console.log("members table: record deleted");
console.log("member_emails table: all related records deleted (CASCADE)");
console.log("user_privileges table: all related records deleted (CASCADE)");

module.exports = { mockWebhookPayloads };
