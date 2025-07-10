# Frontend-Backend Field Mapping Documentation

This document explains how the backend handles field mapping between the frontend JSX components and the backend API endpoints. The service layer has been updated to handle these mappings automatically.

## Authentication

### Registration

| Frontend Field | Backend Field | Notes |
|---------------|--------------|-------|
| `first_name` | `firstName` | Both formats are now supported |
| `last_name` | `lastName` | Both formats are now supported |
| `email` | `email` | No change |
| `phone_number` | `phone` | Both formats are now supported |
| `password` | `password` | No change |
| `user_type` | `roleId` | Mapped to appropriate role via `mapUserTypeToRole` function |

The backend now includes a mapping function that converts `user_type` values to appropriate role names:

```javascript
mapUserTypeToRole(userType) {
  const roleMapping = {
    'client': 'customer',
    'customer': 'customer',
    'restaurant': 'restaurant_owner',
    'delivery': 'delivery_person',
    'admin': 'admin',
    'agent': 'support_agent'
  };
  
  return roleMapping[userType.toLowerCase()] || 'customer';
}
```

### Login Response

The backend now returns user data with both camelCase and snake_case formats for compatibility:

```javascript
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "firstName": "John",
    "lastName": "Doe",
    "phone_number": "+123456789",
    "phone": "+123456789",
    "role": "customer",
    "status": "active"
  },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

## Contact Form

| Frontend Field | Backend Field | Notes |
|---------------|--------------|-------|
| `name` | `name` | No change |
| `email` | `email` | No change |
| `subject` | `subject` | Handles both string and object format |
| `message` | `message` | No change |
| `phone` | `metadata.phone` | Stored in metadata |
| `company` | `metadata.company` | Stored in metadata |
| `website` | `metadata.website` | Stored in metadata |
| `preferred_contact_method` | `metadata.preferred_contact_method` | Stored in metadata |

The Contact model has been updated to include a JSONB `metadata` field that stores additional frontend fields not directly mapped to the database schema.

## Partner Application

| Frontend Field | Backend Field | Notes |
|---------------|--------------|-------|
| `businessName` or `restaurantName` | `restaurantName` | Both formats are now supported |
| `contactName` or `ownerName` | `ownerName` | Both formats are now supported |
| `email` | `email` | No change |
| `phone` | `phone` | No change |
| `address` | `address` | No change |
| `cuisine` or `cuisineType` | `cuisine` | Both formats are now supported |
| `description` or `businessExperience` | `description` | Both formats are now supported |
| Additional fields | `additionalInfo` | Stored as JSON |

The PartnerApplication model has been updated to include a JSONB `additionalInfo` field that stores additional frontend fields:

```javascript
additionalInfo: {
  businessExperience: req.body.businessExperience,
  foundingYear: req.body.foundingYear,
  employeeCount: req.body.employeeCount,
  averageOrderValue: req.body.averageOrderValue,
  deliveryRadius: req.body.deliveryRadius,
  openingHours: req.body.openingHours,
  website: req.body.website,
  socialMedia: req.body.socialMedia
}
```

## Newsletter Subscription

| Frontend Field | Backend Field | Notes |
|---------------|--------------|-------|
| `email` | `email` | No change |
| `source` | `source` | New field, defaults to 'website' |
| `preferences` | `preferences` | New field, stores subscription preferences |

The Newsletter model has been updated to include:

1. `source` field to track where the subscription came from
2. `preferences` JSONB field to store subscription preferences:

```javascript
preferences: {
  promotions: true,
  news: true,
  product_updates: true
}
```

## Migration

A new migration file (`009-add-field-mapping-columns.js`) has been added to update existing database tables with the new fields. This migration adds:

1. `metadata` JSONB field to the `contacts` table
2. `additionalInfo` JSONB field to the `partner_applications` table
3. `source` and `preferences` fields to the `newsletters` table

Run the migration with:

```bash
npx sequelize-cli db:migrate
```

## Testing

After applying these changes, test each form submission to ensure proper field mapping:

1. Registration form
2. Login form
3. Contact form
4. Partner application form
5. Newsletter subscription form 