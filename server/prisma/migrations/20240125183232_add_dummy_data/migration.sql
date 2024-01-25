-- insert into voting
INSERT INTO
    voting (name)
VALUES
    ('2024 Berdford County Elections');

-- insert into panel
INSERT INTO
    panel (
        panel_name,
        panel_color,
        text_color,
        img,
        voting_id
    )
VALUES
    (
        'Panel One',
        'blue',
        'white',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlFSqe7umkEYKvj7EInVRGHkcaOj5nU81Yq6EhPY0pmO7a5rlcBt6wPXyBvFGI830SBPo&usqp=CAU',
        1
    ),
    (
        'Panel Two',
        'red',
        'white',
        'https://npr.brightspotcdn.com/16/2b/54daa3b84977a386800263d36ecc/republican-party-logo.jpg',
        1
    ),
    (
        'Panel Three',
        'black',
        'white',
        'https://upload.wikimedia.org/wikipedia/en/a/a3/IPNY_Logo_3423432.png',
        1
    );

-- insert into candidate
INSERT INTO
    candidate (name, position)
VALUES
    ('Candidate 1', 'President'),
    ('Candidate 2', 'VicePresident'),
    ('Candidate 3', 'Secretary'),
    ('Candidate 4', 'President'),
    ('Candidate 5', 'VicePresident'),
    ('Candidate 6', 'Secretary'),
    ('Candidate 7', 'President'),
    ('Candidate 8', 'VicePresident'),
    ('Candidate 9', 'Secretary');

INSERT INTO
    candidates_on_panels (candidate_id, panel_id)
VALUES
    (1, 1),
    (2, 1),
    (3, 1),
    (4, 2),
    (5, 2),
    (6, 2),
    (7, 3),
    (8, 3),
    (9, 3);

-- This is an empty migration.
INSERT INTO
    device (name)
VALUES
    ('SanFrancisco#1'),
    ('SanFrancisco#2'),
    ('SanFrancisco#3');

INSERT INTO
    staff (email, password)
VALUES
    ('admin@mail.com', 'test1234'),
    ('test@mail.com', 'test1234');

INSERT INTO
    voter (
        voter_id,
        first_and_middle_name,
        last_name,
        street_address,
        city,
        state,
        phone,
        yob,
        permanent_address
    )
VALUES
    (
        100,
        'John Hopkins',
        'Hopkins',
        'Elm Stree 1',
        'San Francisco',
        'California',
        '+34 666 333 222',
        1990,
        'Elm Street 1, CA'
    ),
    (
        101,
        'James Koeln',
        'Koeln',
        'Elm Street 2',
        'San Francisco',
        'California',
        '+34 666 333 222',
        1990,
        'Elm Street 2, CA'
    ),
    (
        102,
        'Rodger Austin',
        'Austin',
        'Elm Street 3',
        'San Francisco',
        'California',
        '+34 666 333 222',
        1990,
        'Elm Street 3, CA'
    ),
    (
        103,
        'Tom Clancy',
        'Clancy',
        'Elm Street 4',
        'San Francisco',
        'California',
        '+34 666 333 222',
        1990,
        'Elm Street 4, CA'
    );