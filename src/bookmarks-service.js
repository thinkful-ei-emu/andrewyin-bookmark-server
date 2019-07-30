const table = 'bookmarks';

const BookmarksService = {
  getAllBookmarks(db) {
    return db(table)
      .select('*');
  },
  getById(db, bookmark_id) {
    return db(table)
      .select('*')
      .where('bookmark_id', bookmark_id)
      .first();
  },
  insertBookmarks(db, bookmark) {
    return db(table)
      .insert(bookmark)
      .returning('*');
  },
  deleteArticle(db, bookmark_id) {
    return db(table)
      .where({ bookmark_id })
      .delete()
      .returning('*');
  },
  updateBookmark(db, bookmark_id, newBookmarkInfo) {
    return db(table)
      .where({ bookmark_id })
      .update(newBookmarkInfo);
  }
};

module.exports = BookmarksService;