# Saviynt SCIP Hard Mode — 100-Question Mock Exam

**Purpose:** Overtraining set for the Saviynt Certified IGA Professional (SCIP / SAVIGA-C01).

**Rules:**
- Select one best answer for each question.
- Suggested practice time: 150 minutes for all 100 questions.
- Do not open the answer key until you finish.
- This is an original practice exam, not a reproduction of live exam questions.

## Questions

### 1. A company imports employees from Workday. When a new employee record is created, Saviynt must automatically create an Active Directory account and assign baseline access based on department. Which design best fits the requirement?

A. Create an access request campaign for each new employee
B. Use an identity lifecycle policy triggered by the joiner event
C. Run an entitlement-owner certification after each import
D. Create an analytics control that lists users without accounts

### 2. A user requests an entitlement. The request must go first to the manager and then to the entitlement owner. Which component primarily controls the approval sequence?

A. Security System
B. Workflow
C. Endpoint
D. Identity import job

### 3. An administrator successfully imports accounts from an application, but no application groups appear in the request catalog. What is the most likely missing step?

A. User import
B. Entitlement import
C. Certification launch
D. SMTP configuration

### 4. A company wants to prevent any user from holding both Create Vendor and Approve Vendor Payment access. Which control is most appropriate?

A. A technical role
B. A segregation-of-duties rule
C. A user-manager campaign
D. A dataset

### 5. Finance Analyst is a business job function that requires two reusable technical bundles spanning SAP, Active Directory, and Microsoft 365. What is the best role model?

A. Place all entitlements directly in a workflow
B. Create one enterprise role containing the required technical roles
C. Create one endpoint containing all applications
D. Assign each entitlement manually

### 6. A manager is asked to review all access held by each direct report. Which campaign design best aligns with the requirement?

A. Entitlement-owner campaign
B. User-manager campaign
C. Role-owner campaign
D. Service-account campaign

### 7. An entitlement owner must review the users and accounts that hold a specific entitlement. Which review type is most suitable?

A. Entitlement-owner access review
B. User-manager access review
C. Role-owner access review
D. Organization-owner review

### 8. An approved request is visible in Saviynt, but the target application has not received the change. Which area should be investigated first?

A. Provisioning task status and connector execution
B. Certification expiration date
C. Analytics history
D. User-manager hierarchy

### 9. A user transfers from Sales to Finance. Sales access must be removed and Finance access granted automatically. Which lifecycle pattern applies?

A. Joiner only
B. Mover
C. Leaver
D. Certification renewal

### 10. An employee leaves the company. Accounts must be disabled and access removed without waiting for a manager request. Which mechanism is most appropriate?

A. Leaver lifecycle policy
B. Entitlement-owner certification
C. Access request workflow
D. Role mining

### 11. Which statement best distinguishes a Saviynt user from an account?

A. A user is a target-system login; an account is the HR identity
B. A user is the governed identity; an account is that identity’s representation on a target system
C. Users and accounts are interchangeable
D. An account exists only for privileged users

### 12. A connected application contains AD groups, database roles, and application permissions. In Saviynt, these access items are generally represented as:

A. Users
B. Entitlements
C. Workflows
D. Campaigns

### 13. A company needs a logical representation of a governed target application under a connection, including its requestable access. Which object is central to that representation?

A. Endpoint
B. Email template
C. Dataset
D. Campaign

### 14. What is the primary responsibility of a Security System?

A. Represent and organize connected application governance and provisioning configuration
B. Store campaign decisions
C. Replace all endpoints
D. Act as an HR authoritative source only

### 15. An application is connected and entitlements are imported, but users still cannot request them. What should be verified next?

A. Whether the entitlements and endpoint are configured as requestable and visible to the intended users
B. Whether a role-owner campaign is active
C. Whether all accounts are orphaned
D. Whether SMTP is disabled

### 16. A requested entitlement should be granted only for 30 days and removed automatically afterward. Which capability best addresses this?

A. Time-bound access with an end date
B. A permanent enterprise role
C. An account import
D. A static analytics report

### 17. A manager approves a request, but a second approval should occur only when the entitlement is high risk. What is the best design?

A. A conditional branch in the approval workflow
B. A separate identity import
C. A fixed endpoint owner
D. A certification campaign for every request

### 18. A user requests access that violates an SoD rule. The company wants the request stopped before provisioning unless an authorized exception is approved. This is an example of:

A. Preventive SoD control
B. Detective certification only
C. Account reconciliation
D. Role mining

### 19. An existing user already holds a toxic combination that was granted outside Saviynt. Which process is most likely to identify it after aggregation?

A. Detective SoD analysis
B. Joiner provisioning
C. Password reset
D. Request catalog configuration

### 20. A valid business exception allows a user to retain conflicting access for six months with compensating oversight. What should be associated with the violation?

A. A mitigating control with appropriate ownership and validity
B. A technical role only
C. An endpoint filter
D. An email template

### 21. Which outcome is the core objective of access certification?

A. Confirm that existing access remains appropriate and revoke it when it does not
B. Create every target account
C. Import application metadata
D. Configure network connectivity

### 22. A certifier has reviewed all line items but has not finalized the review. Why might remediation not begin?

A. Decisions generally must be submitted or completed before downstream remediation proceeds
B. The endpoint must first be deleted
C. A new identity source is required
D. SMTP must always be enabled for revocation

### 23. A campaign should route review items to the person responsible for a business role. Which ownership information is most important?

A. Role owner or primary certifier
B. Account creation date
C. Endpoint display name
D. Email server hostname

### 24. A certification contains thousands of low-risk unchanged items, leading to rubber-stamping. Which improvement best preserves control while reducing fatigue?

A. Use risk-based scoping, filters, or intelligent recommendations
B. Remove all certifications
C. Make every entitlement requestable
D. Disable reconciliation

### 25. During a review, a manager cannot determine why an employee has access. Which information would most improve the decision?

A. Access source, role membership, risk context, and usage or account details
B. Only the SMTP port
C. Only the connector password
D. Only the campaign name

### 26. A certification revocation is approved, but access remains on the target. What is the most likely operational dependency?

A. Successful creation and execution of the remediation/provisioning task
B. Creation of a new enterprise role
C. A second identity import before every decision
D. Deletion of the campaign

### 27. A company wants to certify only privileged entitlements across several applications. What is the best approach?

A. Scope the campaign using entitlement attributes or risk filters that identify privileged access
B. Launch a campaign for every imported user
C. Convert privileged entitlements into users
D. Disable endpoint ownership

### 28. A manager delegates review duties temporarily. What governance concern is most important?

A. The delegate must have proper authority, and delegation should be controlled and auditable
B. The delegate must own the target database
C. The delegate must be an endpoint
D. Delegation permanently changes the user’s manager

### 29. A campaign owner needs to know which reviewers have not completed their work. Which capability is most relevant?

A. Campaign progress monitoring and reminders/escalations
B. Entitlement import
C. Role mining
D. Account naming rule

### 30. A reviewer revokes access that was granted through a role. What additional effect must be considered?

A. The access may be reintroduced if the underlying role assignment remains unchanged
B. The user record is automatically deleted
C. The endpoint becomes nonrequestable
D. The security system is archived

### 31. A business role changes frequently because its entitlements are duplicated directly across many roles. What design improvement is best?

A. Place reusable low-level access in technical roles and compose enterprise roles from them
B. Replace roles with email templates
C. Create a separate security system for every entitlement
D. Disable role ownership

### 32. Which role is intended to represent a technical bundle such as AD groups and application permissions?

A. Technical role
B. Enterprise role
C. Campaign role
D. Workflow role

### 33. Which role is intended to represent a business function such as Finance Analyst?

A. Enterprise role
B. Technical role only
C. Endpoint role
D. Connector role

### 34. A role contains an entitlement that has been retired. What is the most controlled response?

A. Update the role definition, assess impacted members, and process removal through governance
B. Delete every user
C. Ignore it until the next joiner event
D. Convert the entitlement into an endpoint

### 35. An enterprise role is assigned automatically based on department. A user changes departments but keeps the role. What should be reviewed?

A. The mover rule and role-removal logic
B. The SMTP configuration
C. The campaign logo
D. The endpoint description

### 36. A role owner wants to understand which users would gain access before a role change is activated. Which practice is best?

A. Analyze or simulate the membership and access impact before implementation
B. Run an email test only
C. Delete all current memberships
D. Disable account imports

### 37. A user receives an entitlement both directly and through a role. The role assignment is removed. What should be expected?

A. The entitlement may remain because another valid assignment source still exists
B. The user must be terminated
C. The endpoint is deleted
D. All direct access is automatically converted to a role

### 38. What is the strongest reason to assign owners to roles?

A. To establish accountability for role content, membership, and certification
B. To provide connector credentials
C. To replace all managers
D. To perform account reconciliation

### 39. A company creates one enormous role containing nearly all corporate access. What is the primary governance problem?

A. It violates least privilege and makes access difficult to understand and certify
B. It prevents users from having accounts
C. It disables analytics
D. It automatically creates SoD mitigations

### 40. Which scenario best justifies direct entitlement assignment rather than a reusable role?

A. A narrowly scoped exceptional access item that does not belong to a stable job-function bundle
B. Every employee’s standard birthright access
C. A common access package used by thousands of users
D. All Finance access across every system

### 41. An authoritative HR import changes a user’s department. What is the most important downstream consideration?

A. User-update rules or lifecycle policies may need to evaluate the changed attribute
B. All entitlements must be re-created manually
C. The certification engine must be uninstalled
D. The Security System name must change

### 42. Which import primarily brings identities from an authoritative source into Saviynt?

A. User or identity import
B. Account import
C. Entitlement import
D. Provisioning job

### 43. Which import primarily brings target-system login records into Saviynt?

A. Account import
B. User import
C. Campaign import
D. Workflow import

### 44. Which import primarily brings application groups and permissions into Saviynt?

A. Entitlement import
B. Identity import
C. Manager import
D. Certification import

### 45. An imported account cannot be linked to a Saviynt user. What is the best term for this condition?

A. Orphan account
B. Enterprise role
C. Mitigating control
D. Primary certifier

### 46. Several accounts are incorrectly linked to the wrong users. Which configuration should be examined first?

A. Account-to-user correlation logic
B. Campaign reminder text
C. Role description
D. SMTP authentication

### 47. A user record is duplicated after an HR feed change. Which area most likely requires correction?

A. Identity matching or reconciliation key configuration
B. Entitlement ownership
C. Certification due date
D. Access request branding

### 48. An account attribute changes directly in the target application. How does Saviynt normally learn about that change?

A. Through the next account reconciliation/import
B. Through an enterprise-role certification only
C. Through SMTP
D. Through a request form without aggregation

### 49. A newly provisioned account exists on the target but still appears pending in Saviynt. What should be checked?

A. Task completion and subsequent reconciliation/status update
B. Role mining schedule only
C. Campaign ownership only
D. The user’s browser cache only

### 50. A terminated user is disabled in the authoritative source, but Saviynt does not initiate deprovisioning. What should be checked first?

A. Whether the termination attribute/status change is imported and mapped to the leaver trigger
B. Whether all entitlements have descriptions
C. Whether a role-owner campaign exists
D. Whether the request catalog is sorted

### 51. An access request is approved, but no provisioning task is created. Which configuration is most relevant?

A. Request fulfillment/provisioning action and endpoint connection configuration
B. Certification reminder frequency
C. User profile photo
D. Analytics chart type

### 52. A connector can read accounts but cannot create them. What is the most likely explanation?

A. Aggregation is configured, but create-account provisioning is missing, unsupported, or failing
B. The campaign is closed
C. The role owner is inactive
D. The user has no email address

### 53. A provisioning task repeatedly fails because the target rejects the generated username. What should be reviewed?

A. Account naming rule and target-system constraints
B. Certification scope
C. SoD ruleset owner
D. Dataset visualization

### 54. A user requests an entitlement but does not yet have an account on the application. What must the fulfillment design address?

A. Whether an account should be created before or along with entitlement assignment
B. Whether a certification should delete the request
C. Whether the entitlement should become a user
D. Whether SMTP should be disabled

### 55. An account is disabled instead of deleted during termination. What is the strongest governance reason for this choice?

A. It can preserve audit evidence and allow controlled retention while preventing use
B. It makes the account requestable
C. It converts access into a role
D. It prevents future imports

### 56. A target application is temporarily unavailable. What should happen to failed provisioning tasks?

A. They should remain traceable and be retried or remediated according to operational procedures
B. They should be silently discarded
C. The users should be deleted
D. All campaigns should be terminated

### 57. An administrator needs to run a connector import on a schedule. Which configuration is most relevant?

A. Job scheduling for the connection/import job
B. Campaign delegation
C. Role ownership
D. Requestable configuration

### 58. Why is reconciliation important after provisioning?

A. It verifies the target’s actual state and detects drift or out-of-band changes
B. It replaces approval workflows
C. It creates all SoD rules
D. It permanently prevents orphan accounts

### 59. A user’s request was approved, but a target-side administrator manually removed the access later. What will most likely expose the discrepancy?

A. A subsequent account/entitlement reconciliation
B. A new SMTP template
C. Role description editing
D. Campaign branding

### 60. An imported entitlement should not be requestable but must remain certifiable. What is the best design?

A. Keep it governed and imported while disabling requestability
B. Stop importing it entirely
C. Convert it to an email template
D. Delete its owner

### 61. A report must retrieve a specific set of records directly from Saviynt’s data using flexible query logic. Which analytics option is generally the best fit?

A. SQL-based analytics
B. A joiner policy
C. An access request workflow
D. A technical role

### 62. Why might an ES-based analytics query be used?

A. To make selected query results available in Elasticsearch for analytics controls and scalable retrieval
B. To provision accounts directly without a connector
C. To replace every workflow
D. To create HR users manually

### 63. What is the initial conceptual step in using an ES-based SQL query?

A. Define and execute a query that retrieves the desired records and makes them available in Elasticsearch
B. Create a certification before writing the query
C. Disable all indexes
D. Delete the SQL source data

### 64. Once data is available in Elasticsearch from an ES-based query, what is a primary use?

A. Build analytics controls that evaluate or present the indexed records
B. Provision target accounts without approval
C. Replace identity correlation
D. Create endpoints automatically

### 65. An auditor asks for all active accounts belonging to terminated users. Which solution is most direct?

A. An analytics control/query joining identity status and account status
B. A role-owner certification only
C. A joiner workflow
D. An entitlement import

### 66. A control should notify an owner whenever a new orphan account is detected. Which design is most appropriate?

A. An analytics control with ownership and notification/action configuration
B. A permanent enterprise role
C. A request catalog category
D. A manager campaign with no scope

### 67. What is the key distinction between an analytics control and an approval workflow?

A. Analytics detects or reports conditions; workflows orchestrate business approvals and processing
B. Analytics provisions all access; workflows only display charts
C. They are identical
D. Workflows import entitlements; analytics creates users

### 68. An analytics result contains many expected service accounts. What is the best way to improve signal quality?

A. Refine filters or exclusions using reliable account attributes and documented exceptions
B. Disable account imports
C. Remove all service-account owners
D. Make every account requestable

### 69. A control query returns no rows after a schema or attribute change. What should be checked first?

A. Whether the query still references valid fields, values, and joins
B. Whether the certification logo changed
C. Whether the role owner logged in
D. Whether the endpoint is requestable

### 70. A dashboard shows stale analytics results even though target data changed. What dependency should be examined?

A. The sequence and schedule of aggregation, query execution, and analytics refresh
B. The number of enterprise roles
C. The user’s manager approval
D. The campaign’s welcome message

### 71. A user update rule should run only when the department changes to Finance. Which design is best?

A. Use a trigger and condition that evaluate the relevant attribute transition
B. Run it on every login
C. Use a certification campaign as the trigger
D. Use SMTP delivery status

### 72. Why is it risky to create a user-update rule that fires on every update without precise conditions?

A. It can cause unnecessary or repeated actions and unintended access changes
B. It prevents all user imports
C. It disables role ownership
D. It makes analytics impossible

### 73. An identity lifecycle policy grants birthright access. Which principle should guide the access included?

A. Least privilege based on reliable identity attributes
B. Maximum access to avoid support tickets
C. Only access that requires manual certification
D. All privileged access

### 74. A contractor reaches the contract end date. Which design best supports timely access removal?

A. A lifecycle rule triggered by the authoritative end-date or inactive status
B. A voluntary request from the contractor
C. A yearly role-mining exercise
D. An entitlement description update

### 75. A lifecycle process provisions an application account before the user’s manager field is populated, causing approval routing failures later. What is the best correction?

A. Ensure authoritative attributes and processing sequence are complete before dependent actions run
B. Delete the Security System
C. Turn every access item into a dataset
D. Disable reconciliation

### 76. A user changes location, but only location-specific access should change; department access should remain. What is the best rule design?

A. Separate narrowly scoped policies for the distinct attribute-driven access sets
B. One rule that removes all access on any change
C. A campaign that re-creates the user
D. An endpoint deletion

### 77. A joiner rule accidentally grants access to inactive prehire records. What control should be strengthened?

A. Eligibility conditions using status and effective/start date
B. The SMTP sender address
C. The role description length
D. Campaign color

### 78. A mover policy adds new access but never removes obsolete access. What security principle is being violated?

A. Least privilege
B. Nonrepudiation only
C. Availability only
D. Password complexity

### 79. An identity attribute used for access decisions is manually editable by end users. What is the primary risk?

A. Users could influence policy evaluation and obtain inappropriate access
B. The connector will stop importing accounts
C. All certifications become read-only
D. The endpoint disappears

### 80. A lifecycle rule produces duplicate provisioning tasks after repeated imports of unchanged data. What should be improved?

A. Change detection, rule conditions, or idempotent processing
B. Campaign reminder frequency
C. Entitlement descriptions
D. Role-owner assignment

### 81. A request form asks users to select a database environment and access level. Why are dynamic request attributes useful?

A. They capture fulfillment data needed to provision the correct access
B. They replace all approvals
C. They eliminate the need for endpoints
D. They certify existing accounts

### 82. An entitlement should be visible only to employees in a specific region. Which configuration concept is most relevant?

A. Request catalog visibility or eligibility rules
B. Account correlation
C. Campaign delegation
D. ES indexing only

### 83. A requester should not be able to approve their own access. Which control is most directly relevant?

A. Workflow routing and separation-of-approval conditions
B. Entitlement import frequency
C. Role naming convention
D. Analytics chart selection

### 84. A request requires manager approval unless it is for low-risk birthright access, which should be automatic. What is the cleanest design?

A. Use separate policy-driven birthright provisioning and request workflows for discretionary access
B. Make all access manually requested
C. Use certifications for initial provisioning
D. Use one unconditional approval for everything

### 85. An approver rejects one entitlement in a request containing several items. What design choice determines whether the remaining items proceed?

A. Workflow and request-item handling configuration
B. Account import correlation
C. Role mining
D. SMTP encryption

### 86. An entitlement owner is inactive, causing requests to stall. What should the organization implement?

A. Ownership hygiene plus fallback, escalation, or reassignment logic
B. Disable all approvals
C. Delete the entitlement
D. Stop importing users

### 87. Why should request justifications be captured and retained?

A. They support informed approval decisions and audit evidence
B. They create target accounts directly
C. They replace SoD analysis
D. They correlate orphan accounts

### 88. A user requests the same entitlement they already hold through another source. What should the request process ideally do?

A. Detect existing effective access or duplicate assignment and prevent unnecessary fulfillment
B. Create a duplicate target account
C. Delete the existing role
D. Launch a leaver event

### 89. A request is approved for an entitlement whose target object was deleted after the last import. What is the most likely result?

A. Provisioning failure until the entitlement data is reconciled or the request is corrected
B. Automatic creation of a new HR identity
C. Successful certification
D. Automatic SoD mitigation

### 90. A high-risk entitlement needs approval by both the owner and security team, regardless of request source. What is the strongest design?

A. Centralize the risk-based approval requirement in the applicable workflow/policy path
B. Rely on approvers to remember informally
C. Use only an entitlement description
D. Disable auditing

### 91. An application team asks why account ownership matters for service accounts. What is the best answer?

A. Ownership establishes accountability for use, review, and remediation of non-person accounts
B. Ownership makes the password public
C. Ownership converts the account into a user
D. Ownership prevents all imports

### 92. A service account is shared by a team and has powerful access. Which governance combination is strongest?

A. Named accountable owner, documented purpose, restricted access, and periodic certification
B. No owner because it is shared
C. Permanent mitigation with no expiry
D. Exclude it from all imports

### 93. A privileged entitlement appears in a standard low-risk role. What should happen first?

A. Review and correct the role design, then assess affected memberships and risk
B. Hide the entitlement from analytics
C. Delete the users
D. Disable SMTP

### 94. An application has no reliable connector for write operations. How can Saviynt still govern fulfillment?

A. Use a manual fulfillment task or supported alternative integration while retaining approval and audit tracking
B. Skip governance entirely
C. Treat every account as an enterprise role
D. Use a certification as the connector

### 95. A manual fulfillment owner marks a task complete, but the target access was never granted. What compensating process is most important?

A. Subsequent reconciliation and exception monitoring
B. A new role description
C. A campaign logo update
D. Disabling all request forms

### 96. Which evidence would best demonstrate that a terminated user’s access was removed?

A. Authoritative termination record, generated remediation tasks, task completion, and reconciled target state
B. Only an email notification
C. Only the role name
D. Only the campaign due date

### 97. An access-review decision is overturned after the campaign closes. What is the best governance response?

A. Use an authorized, auditable remediation or re-request process rather than silently changing history
B. Edit the completed audit record without trace
C. Delete the campaign
D. Disable the application

### 98. A control owner wants Saviynt to automatically remediate every analytics finding. What is the most important design consideration?

A. Ensure the finding is reliable and the automated action is safe, scoped, approved, and reversible where appropriate
B. Automate first and validate later
C. Remove all exception handling
D. Use the same action for every control

### 99. A company passes certifications consistently but still accumulates excessive access between campaigns. What improvement best addresses the gap?

A. Strengthen lifecycle removal, preventive controls, and continuous analytics in addition to periodic certification
B. Run fewer imports
C. Remove role owners
D. Make campaigns longer

### 100. Which preparation strategy is most aligned with Saviynt’s official recommendation for SCIP?

A. Complete Level 100 training, repeat the labs, and gain hands-on experience with basic-to-medium use cases
B. Memorize unofficial dumps only
C. Study only generic IAM definitions
D. Skip the labs and focus only on product marketing

## Answer Sheet

| 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|
|   |   |   |   |   |   |   |   |   |    |

| 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
|---|---|---|---|---|---|---|---|---|---|
|   |   |   |   |   |   |   |   |   |    |

| 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 |
|---|---|---|---|---|---|---|---|---|---|
|   |   |   |   |   |   |   |   |   |    |

| 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 |
|---|---|---|---|---|---|---|---|---|---|
|   |   |   |   |   |   |   |   |   |    |

| 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 |
|---|---|---|---|---|---|---|---|---|---|
|   |   |   |   |   |   |   |   |   |    |

| 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60 |
|---|---|---|---|---|---|---|---|---|---|
|   |   |   |   |   |   |   |   |   |    |

| 61 | 62 | 63 | 64 | 65 | 66 | 67 | 68 | 69 | 70 |
|---|---|---|---|---|---|---|---|---|---|
|   |   |   |   |   |   |   |   |   |    |

| 71 | 72 | 73 | 74 | 75 | 76 | 77 | 78 | 79 | 80 |
|---|---|---|---|---|---|---|---|---|---|
|   |   |   |   |   |   |   |   |   |    |

| 81 | 82 | 83 | 84 | 85 | 86 | 87 | 88 | 89 | 90 |
|---|---|---|---|---|---|---|---|---|---|
|   |   |   |   |   |   |   |   |   |    |

| 91 | 92 | 93 | 94 | 95 | 96 | 97 | 98 | 99 | 100 |
|---|---|---|---|---|---|---|---|---|---|
|   |   |   |   |   |   |   |   |   |     |