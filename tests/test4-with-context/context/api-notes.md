# API Development Notes

## Authentication

All endpoints require Bearer token authentication:

```http
Authorization: Bearer <jwt_token>
```

## Error Handling

Standard error response format:

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with id '123' not found",
    "status": 404
  }
}
```

## Pagination

List endpoints support pagination:

```http
GET /users?page=1&limit=20
```

Response:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Rate Limiting

- 100 requests per minute per API key
- 1000 requests per hour per user

## Webhooks

Available webhook events:

- `user.created`
- `user.updated`
- `user.deleted`

## Testing

Use the following test credentials:

```
API_KEY: test_key_12345
TEST_USER: test@example.com
TEST_PASS: TestPass123!
```
