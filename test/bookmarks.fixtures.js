function makeBookmarksFixtures() {
    return [
        {
            id: 1,
            title: 'First Bookmark',
            url: 'https://111.com',
            rating: 4,
            description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
        },
        {
            id: 2,
            title: 'Second Bookmark',
            url: 'https://222.com',
            rating: 5,
            description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
        },
        {
            id: 3,
            title: 'Third Bookmark',
            url: 'https://333.com',
            rating: 1,
            description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
        },
        {
            id: 4,
            title: 'Fourth Bookmark',
            url: 'https://444.com',
            rating: 3,
            description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
        },
    ]
}

module.exports = {
    makeBookmarksFixtures
}