# Sales CRM Prisma Schema

This document contains the current database schema for the Sales CRM project.

## Models

### Organization
- `id`: String (UUID, PK)
- `name`: String
- `slug`: String (Unique)
- `logoUrl`: String?
- `users`: User[]
- `leads`: Lead[]
- ... (and other relations)

### User
- `id`: String (UUID, PK)
- `name`: String
- `email`: String (Unique)
- `role`: Role (MANAGER, SALES_REP, ORG_ADMIN, LEAD, CEO)
- `organizationId`: String (FK to Organization)
- `teamId`: String? (FK to Team)
- `managedTeam`: Team?

### Team
- `id`: String (UUID, PK)
- `name`: String
- `managerId`: String (Unique, FK to User)
- `members`: User[]

### Lead
- `id`: String (UUID, PK)
- `contactName`: String
- `company`: String
- `email`: String?
- `phone`: String?
- `organizationId`: String (FK to Organization)
- `stage`: LeadStage (NEW, CONTACTED, NOT_INTERESTED, MEETING_SET, NEGOTIATION, COLD, CHATTING, CLIENT, WON)
- `subStatus`: LeadSubStatus (CHATTING, NOT_ANSWERED, WRONG_NO, NO_REQUIREMENT, BUDGET_LOW, PROPOSAL_SENT, WARM_LEAD, TEXTED, BLANK)
- `dealValueInr`: Decimal
- `priority`: LeadPriority (HIGH, MEDIUM, LOW)
- `city`: String?
- `state`: String?
- `sourceId`: String? (FK to LeadSource)
- `ownerId`: String (FK to User)
- `createdById`: String (FK to User)
- `followUpAt`: DateTime?
- `closedAt`: DateTime?

### Interaction
- `id`: String (UUID, PK)
- `leadId`: String (FK to Lead)
- `userId`: String (FK to User)
- `type`: InteractionType (CALL, EMAIL, WHATSAPP, MEETING, IN_PERSON, CHAT)
- `summary`: String?
- `occurredAt`: DateTime

### Note
- `id`: String (UUID, PK)
- `leadId`: String (FK to Lead)
- `userId`: String (FK to User)
- `content`: String
- `aiExtracted`: Boolean

### ChatThread & ChatMessage
- `ChatThread`: Links a Lead to a conversation.
- `ChatMessage`: Individual messages in a thread.

## Enums

- `LeadStage`: NEW, CONTACTED, NOT_INTERESTED, MEETING_SET, NEGOTIATION, COLD, CHATTING, CLIENT, WON
- `LeadSubStatus`: CHATTING, NOT_ANSWERED, WRONG_NO, NO_REQUIREMENT, BUDGET_LOW, PROPOSAL_SENT, WARM_LEAD, TEXTED, BLANK
- `Role`: MANAGER, SALES_REP, ORG_ADMIN, LEAD, CEO
- `InteractionType`: CALL, EMAIL, WHATSAPP, MEETING, IN_PERSON, CHAT
