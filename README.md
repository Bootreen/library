- [Current build](https://boot-library.onrender.com)

# Boot Library API Documentation

## Endpoints

### 1\. Get All Users

GET /users

Fetches all users from the database.

#### Payload

    No request body required

#### Response on Success

    [ { "id": 1, "name": "John Doe" },
        { "id": 2, "name": "Jane Doe" }, ... ]

#### Errors

    { "msg": "There're no users in database" }

### 2\. Get User by ID

GET /users/:userId

Fetches a user by their numeric ID.

#### Payload

    No request body required

#### Response on Success

    { "id": 1, "name": "John Doe" }

#### Errors

    { "error": "User not found" }

### 3\. Add a User

POST /users

Adds a new user to the database.

#### Payload

    { "name": "Alice Johnson" }

#### Response on Success

    {
        "id": 3,
        "name": "Alice Johnson"
      }

#### Errors

    { "error": "All records have failed syntax check, no new records were added" }

### 4\. Edit User Info

PATCH /users/:userId

Edits user information based on their ID.

#### Payload

    { "name": "Alex Boot" }

#### Response on Success

    {
        "id": 1,
        "name": "Alex Boot"
      }

#### Errors

    { "error": "User not found" }

    { "error": "All records have failed syntax check, no new records were added" }

### 5\. Delete User

DELETE /users/:userId

Deletes a user from the database.

#### Payload

    No request body required

#### Response on Success

    { "msg": "User with id 1 deleted successfully." }

#### Errors

    { "error": "User not found" }

### 6\. Get All Books

GET /books

Fetches all books from the database, including total and available copies.

#### Payload

    No request body required

#### Response on Success

    [
      {
        "id": 1,
        "title": "1984",
        "author": "George Orwell",
        "coverImage": "link_to_cover_image",
        "totalCopies": 5,
        "copiesInStock": 2
      },
      ...
      ]

#### Errors

    { "msg": "There're no books in database" }

### 7\. Get Book by ID

GET /books/:bookId

Fetches a book by its numeric ID, including total and available copies.

#### Payload

    No request body required

#### Response on Success

    {
      "id": 1,
      "title": "1984",
      "author": "George Orwell",
      "coverImage": "link_to_cover_image",
      "totalCopies": 5,
      "copiesInStock": 2
      }

#### Errors

    { "error": "Book not found" }

### 8\. Delete Book by ID

DELETE /books/:bookId

Deletes all book copies first, then deletes book by its numeric ID

#### Payload

    No request body required

#### Response on Success

    "msg": "Book with id 115 deleted successfully."

#### Errors

    { "error": "Book not found" }

### 9\. Rent a Book

POST /books/:bookId/rent

Rents a book by its ID for a specific user.

#### Payload

    { "userId": 1 }

#### Response on Success

    { "copyId": 3 }

#### Errors

    { "error": "No free copies left" }

### 10\. Return a Book

DELETE /books/:bookId/rent

Deletes the rental record for a book copy.

#### Payload

    { "copyId": 3 }

#### Response on Success

    { "msg": "Rental record deleted successfully." }

#### Errors

    { "error": "This copy of the book is not rented" }

### 11\. Get All Rentals by User

GET /users/:userId/rentals

Fetches all rentals for a specific user.

#### Payload

    No request body required

#### Response on Success

    [
        {
          "copyId": 3,
          "rentalDate": "2024-07-30T12:34:56Z",
          "title": "1984",
          "bookId": 1
        },
        ...
      ]

#### Errors

    { "error": "User not found" }

    { "error": "This user didn't rent any book" }

### 12\. Bulk Insert Users or Books

POST /bulk/:table

Inserts multiple users or books in bulk.

#### Payload

    { // For users table
        "payload": [
          { "name": "Bob Smith" },
          { "name": "Alex Jones" },
          ...
        ]
      }

    { // For books table
        "payload": [
          { "title": "Brave New World", "author": "Aldous Huxley", "coverImage": "url", "copies": 3 },
          { "title": "1984", "author": "George Orwell", "coverImage": "url", "copies": 3 }
          ...
        ]
      }

#### Response on Success

    { "msg": "2 records have invalid syntax and were automatically rejected. 3 records already exist in database and were automatically rejected. 9 records were successfully added." }

#### Errors

    { "error": "All records have failed syntax check, no new records were added" }

    { "error": "All valid records already exist, no new records were added" }

### 13\. Handle 404 Errors

ALL \*

Handles any invalid endpoints not defined in the API.

#### Errors

    Shows 404.html page
