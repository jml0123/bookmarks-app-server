-- const bookmarks =  [{
 --   title: "Test",
 --   url: "https://thinkful.com",
 --   description: "Test",
--    id: "1", 
--      rating: 3;
-- }]


drop table if exists bookmarks;

create table bookmarks(
    id INTEGER primary key generated by default as identity,
    url TEXT NOT NULL,
    title TEXT NOT NULL, 
    description TEXT,
    rating INTEGER NOT NULL
);

insert into bookmarks (title, url, rating, description)
values
    ('Bail Project', 'https://bailproject.org/', 5,
    'The Bail Project™ National Revolving Bail Fund is a critical tool to prevent 
    incarceration and combat racial and economic disparities in the bail system.'),
    ('Reclaim The Block', 'https://www.reclaimtheblock.org/', 5, '
    Support our work to make sure Minneapolis funds real investments in community safety!'),
    ('CUAPB', 'https://www.cuapb.org/', 5, ''),
    ('Campaign Zero', 'https://www.joincampaignzero.org/', 5, 
    'WE CAN END POLICE VIOLENCE IN AMERICA'),
    ('North Star Health', 'https://www.northstarhealthcollective.org/', 5, ''),
    ('Fair Fight', 'https://fairfight.com/', 5, 
    'Voting is the bedrock on which our community’s future and your ambitions are built.'),
    ('Black Visions Collective', 'https://www.blackvisionsmn.org/', 5, 
    'creating the conditions for long term 
SUCCESS AND TRANSFORMATION'),
    ('Brooklyn Bail Fund', 'https://brooklynbailfund.org/donate', 5, 
    'Committed to challenging the racism, inequality and injustice
    of a criminal legal system and immigration and deportation'),
    ('Action Bail Fund', 'https://secure.actblue.com/donate/wp4bl', 5, ''),
    ('BedStuy Strong', 'https://bedstuystrong.com', 5, '');


