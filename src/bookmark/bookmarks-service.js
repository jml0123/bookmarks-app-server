const BookmarksService = {
    getAllBookmarks(knex) {
        return knex
            .select('*')
            .from('bookmarks')
    },
    getBookmarkById(knex, id){
        return knex
            .select('*')
            .from('bookmarks')
            .where({id})
            .first()
    },
    insertBookmark(){},
    deleteBookmark(){},
    updateBookmark(){},
}

module.exports = BookmarksService;