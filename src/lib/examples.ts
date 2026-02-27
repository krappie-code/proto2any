export const EXAMPLE_PROTO = `syntax = "proto3";

package example.v1;

// User represents a user in the system
message User {
  // Unique identifier for the user
  int64 id = 1;
  
  // User's email address
  string email = 2;
  
  // User's full name
  string full_name = 3;
  
  // User's current status
  UserStatus status = 4;
  
  // List of user's roles
  repeated Role roles = 5;
  
  // User's profile settings
  Profile profile = 6;
  
  // Timestamp when user was created
  int64 created_at = 7;
  
  // Timestamp when user was last updated
  int64 updated_at = 8;
}

// Profile contains user profile information
message Profile {
  // Profile display name
  string display_name = 1;
  
  // Profile bio/description
  string bio = 2;
  
  // Profile avatar URL
  string avatar_url = 3;
  
  // User's preferred language
  string language = 4;
  
  // User's timezone
  string timezone = 5;
}

// Role represents a user role in the system
message Role {
  // Role identifier
  string id = 1;
  
  // Human-readable role name
  string name = 2;
  
  // List of permissions for this role
  repeated Permission permissions = 3;
}

// Permission represents a specific permission
message Permission {
  // Permission identifier
  string id = 1;
  
  // Human-readable permission name
  string name = 2;
  
  // Permission description
  string description = 3;
}

// UserStatus enumeration
enum UserStatus {
  USER_STATUS_UNSPECIFIED = 0;
  USER_STATUS_ACTIVE = 1;
  USER_STATUS_INACTIVE = 2;
  USER_STATUS_SUSPENDED = 3;
  USER_STATUS_DELETED = 4;
}`;