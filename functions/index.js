const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// 1. SLA Checker (Scheduled)
// Runs every 15 minutes to check for issues nearing SLA breach
exports.checkSLA = functions.pubsub.schedule("every 15 minutes").onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    // Example: Find issues created > 4 hours ago that are still 'Open'
    const staleIssues = await db.collection("operational_issues")
        .where("status", "==", "Open")
        .where("createdAt", "<", new admin.firestore.Timestamp(now.seconds - 14400, 0)) // 4 hours ago
        .get();

    staleIssues.forEach(async (doc) => {
        // Logic to send notification or escalate
        console.log(`Issue ${doc.id} is breaching SLA.`);

        // Update status to 'Escalated' if needed
        // await doc.ref.update({ severity: 'Critical', tags: admin.firestore.FieldValue.arrayUnion('SLA Breach') });
    });

    return null;
});

// 2. Auto-Assignment (Trigger)
// Assigns new electrical issues to the default electrical engineer
exports.autoAssign = functions.firestore
    .document("operational_issues/{issueId}")
    .onCreate(async (snap, context) => {
        const issue = snap.data();

        if (issue.type === "Electrical" && !issue.assignee) {
            return snap.ref.update({
                assignee: {
                    uid: "engineer_123",
                    name: "Default Electrical Eng.",
                    email: "sparky@primistine.com"
                },
                status: "Assigned",
                history: admin.firestore.FieldValue.arrayUnion({
                    action: "Auto-Assigned",
                    by: "System",
                    timestamp: new Date().toISOString()
                })
            });
        }
    });

// 3. Status Automation (Trigger)
// Update 'resolvedAt' timestamp when status changes to Resolved
exports.onStatusChange = functions.firestore
    .document("operational_issues/{issueId}")
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();

        if (newData.status === "Resolved" && oldData.status !== "Resolved") {
            return change.after.ref.update({
                resolvedAt: new Date().toISOString(),
                timeToResolve: "Calculated Duration Here" // Logic to calc diff
            });
        }
    });
