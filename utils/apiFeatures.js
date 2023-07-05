class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // FILTER
  filter() {
    // 1A) filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // 2A) Advanced filtering
    // SEARCH QUERY : ?difficulty=easy&duration[gte]=5
    // QUERY OBJECT : { difficulty: 'easy', duration: [ gte:'5' ]}
    // Expected QUERY OBJECT : { difficulty: 'easy', duration: [ $gte:'5' ]}
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // In mongoose there are two ways of writing a database query
    // Way 01 : Using objects
    // When we use await , the query will execute and return a document
    // If we use await , then we can't  use sorting methods [limit,sort,fields ] on return object
    this.query.find(JSON.parse(queryStr));

    // Way 02 : Using mongoose methods
    // const query = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');
    return this;
  }

  // SORT
  sort() {
    if (this.queryString.sort) {
      // console.log(this.queryString.sort);
      // Sort by given field (i.e price , difficulty , rattingAverage )
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    }
    return this;
  }

  // Limit Fields
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // - = Exclude this field
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // Paginate page
  paginatePage() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // page=2&limit=10 , 1-10 ===> Page1 ,  11-20 ===> Page2  , 21-30 Page3
    // query = query.skip(skip).limit(limit);
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
