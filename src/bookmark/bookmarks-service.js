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
    insertBookmark(knex, newBookmark){
        return knex
            .insert(newBookmark)
            .into('bookmarks')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    deleteBookmark(knex, id){
        return knex
            .from('bookmarks')
            .where({id})
            .delete()
    },
    updateBookmark(){},
}

module.exports = BookmarksService;