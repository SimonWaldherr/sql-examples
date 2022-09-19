/* Here is a very simple example of what user management could look like.
It is very important here that even with very simple applications, a password should never be stored in plain text in the database.
The nice thing is that you don't have to save passwords in plain text, it's enough to save a hash result of the password.
And with every login attempt, a hash value is also calculated for the entered password, which is then compared with the value in the database. If the hash matches, the user is logged in.
If you want to make it even more secure, you can add a so-called salt to the entered password. This makes it even more difficult for the bad guys. */

DROP
    TABLE IF EXISTS "users";


CREATE TABLE
    IF NOT EXISTS "users" (
        "creation" DATE NOT NULL, 
        "lastlogin" DATE NOT NULL,
        "username" TEXT NOT NULL, 
        "password" TEXT NOT NULL,
        "permissions" INT NOT NULL,
        "comment" TEXT NULL
    );

INSERT INTO
    "users" ("creation", "lastlogin", "username", "password", "permissions")
VALUES
    (date('now'), date('now'), 'JohnDoe', 'do-not-save-passwords-use-hash-functions', 3);


SELECT * FROM "users"