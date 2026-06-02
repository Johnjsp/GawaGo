# GawaGo Database Structure and Dictionary

This section presents the database structure and dictionary of the GawaGo Employment Platform. The format follows a table dictionary style showing the column number, field name, data type, nullability, default value, and primary key indicator. The database structure is based on the current Django backend implementation of the system.

## Table 1
## `auth_user`

| cid | name | type | notnull | dflt_value | pk |
|---:|---|---|---:|---|---:|
| 0 | id | INTEGER | 1 | NULL | 1 |
| 1 | password | VARCHAR(128) | 1 | NULL | 0 |
| 2 | last_login | DATETIME | 0 | NULL | 0 |
| 3 | is_superuser | BOOLEAN | 1 | NULL | 0 |
| 4 | username | VARCHAR(150) | 1 | NULL | 0 |
| 5 | first_name | VARCHAR(150) | 1 | NULL | 0 |
| 6 | last_name | VARCHAR(150) | 1 | NULL | 0 |
| 7 | email | VARCHAR(254) | 1 | NULL | 0 |
| 8 | is_staff | BOOLEAN | 1 | NULL | 0 |
| 9 | is_active | BOOLEAN | 1 | NULL | 0 |
| 10 | date_joined | DATETIME | 1 | NULL | 0 |

This table stores the login and account information of registered users in the GawaGo Employment Platform. It includes user credentials, name, email address, account status, and administrator access indicators. Household and worker-specific profile information is stored separately in the `accounts_userprofile` table.

## Table 2
## `accounts_userprofile`

| cid | name | type | notnull | dflt_value | pk |
|---:|---|---|---:|---|---:|
| 0 | id | BIGINT | 1 | NULL | 1 |
| 1 | user_id | INTEGER | 1 | NULL | 0 |
| 2 | role | VARCHAR(20) | 1 | worker | 0 |
| 3 | phone | VARCHAR(30) | 1 | '' | 0 |
| 4 | bio | TEXT | 1 | '' | 0 |
| 5 | years_experience | INTEGER UNSIGNED | 1 | 0 | 0 |
| 6 | skills | JSON | 1 | [] | 0 |
| 7 | hourly_rate | DECIMAL(10,2) | 0 | NULL | 0 |
| 8 | daily_rate | DECIMAL(10,2) | 0 | NULL | 0 |
| 9 | verification_status | VARCHAR(20) | 1 | pending | 0 |
| 10 | location_label | VARCHAR(255) | 1 | '' | 0 |
| 11 | latitude | DECIMAL(10,7) | 0 | NULL | 0 |
| 12 | longitude | DECIMAL(10,7) | 0 | NULL | 0 |
| 13 | profile_photo | VARCHAR(100) | 0 | NULL | 0 |
| 14 | average_rating | DECIMAL(3,2) | 0 | NULL | 0 |
| 15 | rating_count | INTEGER UNSIGNED | 1 | 0 | 0 |

This table stores the profile information of each registered user. It identifies whether the user is a household or worker and stores personal details, worker skills, service rates, verification status, location coordinates, profile image, and rating summary. Each profile is connected to one record in the `auth_user` table.

## Table 3
## `accounts_workeravailability`

| cid | name | type | notnull | dflt_value | pk |
|---:|---|---|---:|---|---:|
| 0 | id | BIGINT | 1 | NULL | 1 |
| 1 | worker_id | INTEGER | 1 | NULL | 0 |
| 2 | date | DATE | 1 | NULL | 0 |
| 3 | start_time | TIME | 1 | NULL | 0 |
| 4 | end_time | TIME | 1 | NULL | 0 |
| 5 | is_available | BOOLEAN | 1 | 1 | 0 |

This table stores the availability schedule of workers. It records the date and time windows when a worker is available for job matching. The system uses this table during smart matching to recommend workers who are available for the requested schedule.

## Table 4
## `accounts_passwordresetrequest`

| cid | name | type | notnull | dflt_value | pk |
|---:|---|---|---:|---|---:|
| 0 | id | BIGINT | 1 | NULL | 1 |
| 1 | user_id | INTEGER | 1 | NULL | 0 |
| 2 | email | VARCHAR(254) | 1 | NULL | 0 |
| 3 | token_hash | VARCHAR(128) | 1 | NULL | 0 |
| 4 | created_at | DATETIME | 1 | NULL | 0 |
| 5 | expires_at | DATETIME | 1 | NULL | 0 |
| 6 | used_at | DATETIME | 0 | NULL | 0 |
| 7 | attempts | INTEGER UNSIGNED | 1 | 0 | 0 |

This table stores password reset requests made by users. It contains the email address, hashed reset token, expiration date, usage status, and number of verification attempts. The system uses this table to securely process forgot-password and reset-password transactions.

## Table 5
## `accounts_signupverificationrequest`

| cid | name | type | notnull | dflt_value | pk |
|---:|---|---|---:|---|---:|
| 0 | id | BIGINT | 1 | NULL | 1 |
| 1 | user_id | INTEGER | 1 | NULL | 0 |
| 2 | email | VARCHAR(254) | 1 | NULL | 0 |
| 3 | token_hash | VARCHAR(128) | 1 | NULL | 0 |
| 4 | created_at | DATETIME | 1 | NULL | 0 |
| 5 | expires_at | DATETIME | 1 | NULL | 0 |
| 6 | verified_at | DATETIME | 0 | NULL | 0 |

This table stores account verification requests created during user registration. It keeps the email address, hashed verification token, expiration date, and verification timestamp. This supports email verification before or after account activation depending on the registration flow.

## Table 6
## `jobs_jobposting`

| cid | name | type | notnull | dflt_value | pk |
|---:|---|---|---:|---|---:|
| 0 | id | BIGINT | 1 | NULL | 1 |
| 1 | household_id | INTEGER | 1 | NULL | 0 |
| 2 | title | VARCHAR(255) | 1 | NULL | 0 |
| 3 | job_type | VARCHAR(120) | 1 | NULL | 0 |
| 4 | required_skill | VARCHAR(120) | 1 | NULL | 0 |
| 5 | schedule | VARCHAR(255) | 1 | NULL | 0 |
| 6 | schedule_type | VARCHAR(80) | 1 | '' | 0 |
| 7 | preferred_date | DATE | 0 | NULL | 0 |
| 8 | preferred_time | TIME | 0 | NULL | 0 |
| 9 | description | TEXT | 1 | '' | 0 |
| 10 | location_label | VARCHAR(255) | 1 | NULL | 0 |
| 11 | latitude | DECIMAL(10,7) | 1 | NULL | 0 |
| 12 | longitude | DECIMAL(10,7) | 1 | NULL | 0 |
| 13 | service_rate | DECIMAL(10,2) | 1 | NULL | 0 |
| 14 | worker_slots | INTEGER UNSIGNED | 1 | 1 | 0 |
| 15 | status | VARCHAR(20) | 1 | open | 0 |
| 16 | created_at | DATETIME | 1 | NULL | 0 |
| 17 | completed_at | DATETIME | 0 | NULL | 0 |

This table stores job postings created by household users. It includes the job title, type, required skill, schedule, location, service rate, number of workers needed, and job status. The system uses this table for job listing, matching, application management, and service completion tracking.

## Table 7
## `jobs_jobapplication`

| cid | name | type | notnull | dflt_value | pk |
|---:|---|---|---:|---|---:|
| 0 | id | BIGINT | 1 | NULL | 1 |
| 1 | job_id | BIGINT | 1 | NULL | 0 |
| 2 | worker_id | INTEGER | 1 | NULL | 0 |
| 3 | status | VARCHAR(20) | 1 | pending | 0 |
| 4 | applied_at | DATETIME | 1 | NULL | 0 |
| 5 | updated_at | DATETIME | 1 | NULL | 0 |
| 6 | note | TEXT | 1 | '' | 0 |

This table stores job applications submitted by workers. It links a worker to a specific job posting and records the application status, submission date, update date, and worker note. The system uses this table to support hiring decisions, rejection, completion, and application tracking.

## Table 8
## `jobs_jobimage`

| cid | name | type | notnull | dflt_value | pk |
|---:|---|---|---:|---|---:|
| 0 | id | BIGINT | 1 | NULL | 1 |
| 1 | job_id | BIGINT | 1 | NULL | 0 |
| 2 | image | VARCHAR(100) | 1 | NULL | 0 |
| 3 | uploaded_at | DATETIME | 1 | NULL | 0 |
| 4 | order | INTEGER UNSIGNED | 1 | 0 | 0 |

This table stores uploaded images related to job postings. It allows households to attach images that help workers understand the job location, task condition, or service requirement. The display order is stored to control the sequence of job images.

## Table 9
## `reviews_review`

| cid | name | type | notnull | dflt_value | pk |
|---:|---|---|---:|---|---:|
| 0 | id | BIGINT | 1 | NULL | 1 |
| 1 | author_id | INTEGER | 1 | NULL | 0 |
| 2 | target_id | INTEGER | 1 | NULL | 0 |
| 3 | author_role | VARCHAR(20) | 1 | NULL | 0 |
| 4 | target_role | VARCHAR(20) | 1 | NULL | 0 |
| 5 | job_id | BIGINT | 0 | NULL | 0 |
| 6 | job_title | VARCHAR(255) | 1 | '' | 0 |
| 7 | rating | DECIMAL(2,1) | 0 | NULL | 0 |
| 8 | feedback | TEXT | 1 | '' | 0 |
| 9 | created_at | DATETIME | 1 | NULL | 0 |

This table stores reviews and feedback submitted after job completion. It supports household-to-worker ratings and worker-to-household feedback. The table records the author, target user, related job, rating value, written feedback, and creation date to support the platform reputation system.

## Table 10
## `notifications_notification`

| cid | name | type | notnull | dflt_value | pk |
|---:|---|---|---:|---|---:|
| 0 | id | BIGINT | 1 | NULL | 1 |
| 1 | recipient_id | INTEGER | 1 | NULL | 0 |
| 2 | notification_type | VARCHAR(30) | 1 | NULL | 0 |
| 3 | title | VARCHAR(255) | 1 | NULL | 0 |
| 4 | message | TEXT | 1 | NULL | 0 |
| 5 | is_read | BOOLEAN | 1 | 0 | 0 |
| 6 | created_at | DATETIME | 1 | NULL | 0 |

This table stores in-system notifications received by users. It records the notification recipient, notification category, title, message, read status, and date created. The system uses this table for job updates, application status changes, verification results, account activity, completion reminders, and review reminders.

## Table 11
## `common_verificationrequest`

| cid | name | type | notnull | dflt_value | pk |
|---:|---|---|---:|---|---:|
| 0 | id | BIGINT | 1 | NULL | 1 |
| 1 | worker_id | INTEGER | 1 | NULL | 0 |
| 2 | primary_id_name | VARCHAR(255) | 1 | NULL | 0 |
| 3 | secondary_doc_name | VARCHAR(255) | 1 | NULL | 0 |
| 4 | primary_id_file | VARCHAR(100) | 0 | NULL | 0 |
| 5 | secondary_doc_file | VARCHAR(100) | 0 | NULL | 0 |
| 6 | notes | TEXT | 1 | '' | 0 |
| 7 | status | VARCHAR(20) | 1 | pending | 0 |
| 8 | submitted_at | DATETIME | 1 | NULL | 0 |
| 9 | reviewed_at | DATETIME | 0 | NULL | 0 |
| 10 | review_note | TEXT | 1 | '' | 0 |

This table stores worker verification requests submitted to the system administrator. It contains the names and uploaded files of the worker's identification documents, submission notes, verification status, submission date, review date, and administrator review remarks. This table supports the trust and verification feature of the platform.

## Relationship Summary

| Relationship | Cardinality | Description |
|---|---|---|
| `auth_user` to `accounts_userprofile` | 1:1 | Each user account has one profile record |
| `auth_user` to `accounts_workeravailability` | 1:N | One worker can create many availability records |
| `auth_user` to `jobs_jobposting` | 1:N | One household can create many job postings |
| `auth_user` to `jobs_jobapplication` | 1:N | One worker can submit many job applications |
| `jobs_jobposting` to `jobs_jobapplication` | 1:N | One job posting can receive many applications |
| `jobs_jobposting` to `jobs_jobimage` | 1:N | One job posting can have many uploaded images |
| `auth_user` to `reviews_review` | 1:N | One user can write and receive many reviews |
| `jobs_jobposting` to `reviews_review` | 1:N | One completed job can have reviews from both parties |
| `auth_user` to `notifications_notification` | 1:N | One user can receive many notifications |
| `auth_user` to `common_verificationrequest` | 1:N | One worker can submit many verification requests |

The database uses foreign key relationships to connect user accounts, profiles, jobs, applications, reviews, notifications, and verification records. The matching and analytics modules are implemented through backend service logic and currently compute results from the existing tables instead of storing them in separate database tables.
