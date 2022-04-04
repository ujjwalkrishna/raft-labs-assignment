const express = require('express');
const app = express();
let ejs = require('ejs');
const fs = require('fs');
const csv = require('csv-parser');
var csvWriter = require('csv-write-stream');

const PORT = process.env.PORT || 3000;

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Read Books CSV File
async function getBooks() {
    return new Promise((resolve, reject) => {
        let books = []
        try {
            fs.createReadStream('books.csv')
                .pipe(csv({ separator: ';' }))
                .on('data', (data) => books.push(data))
                .on('end', () => {
                    console.log('Books reading done...');
                    resolve(books);
                });
        } catch (error) {
            resolve(error);
        }
    })
}

//Read Magazines CSV File
async function getMagazines() {
    return new Promise((resolve, reject) => {
        let magazines = []
        try {
            fs.createReadStream('magazines.csv')
                .pipe(csv({ separator: ';' }))
                .on('data', (data) => magazines.push(data))
                .on('end', () => {
                    console.log('Magazines reading done...');
                    resolve(magazines);
                });
        } catch (error) {
            resolve(error);
        }
    })
}

// Home Route
app.get('/', async (req, res) => {
    res.render('home');
})

//Get Books and Magazines detail
app.get('/book-magazine-details', async (req, res) => {
    let books = await getBooks();
    let magazines = await getMagazines();
    res.render('books-magazines', { books, magazines });
})

//Get Books and Magazines details together sorted by their title
app.get('/book-magazine-sorted', async (req, res) => {
    let books = await getBooks();
    let magazines = await getMagazines();

    let combined = [];
    books.forEach((ele) => {
        combined.push(ele);
    })

    magazines.forEach((ele) => {
        combined.push(ele);
    })

    console.log(combined);
    combined.sort((a, b) => {
        let fa = a['﻿title'].toLowerCase(),
            fb = b['﻿title'].toLowerCase();

        if (fa < fb) {
            return -1;
        }
        if (fa > fb) {
            return 1;
        }
        return 0;
    })
    return res.render('sorted-books-magazines', { data: combined });
})

//Get Book by ISBN
app.post('/search-book', async (req, res) => {
    let isbn = req.body.isbn;
    let books = await getBooks();
    let filtered_books = books.filter((book) => {
        return book['isbn'] == isbn
    });
    if (filtered_books.length >= 1) {
        return res.json(filtered_books[0]);
    } else {
        return res.json({ 'Message': `No books found with given isbn: ${isbn}` });
    }
})

//Get Magazine by ISBN
app.post('/search-magazine', async (req, res) => {
    let isbn = req.body.isbn;
    let magazines = await getMagazines();
    let filtered_magazines = magazines.filter((magazine) => {
        return magazine['isbn'] == isbn
    });
    if (filtered_magazines.length >= 1) {
        return res.json(filtered_magazines[0]);
    } else {
        return res.json({ 'Message': `No magazines found with given isbn: ${isbn}` });
    }
})

//Get Books and Magazines by Authors email
app.post('/search-by-authorsemail', async (req, res) => {

    let email = req.body.email;
    let books = await getBooks();
    let magazines = await getMagazines();
    let filtered_books = books.filter((book) => {
        let authors_email = book['authors'].split(",");
        let rr = authors_email.find((auth_email) => {
            return auth_email == email;
        })
        return rr != undefined;
    });

    let filtered_magazines = magazines.filter((magazine) => {
        let authors_email = magazine['authors'].split(",");
        let rr = authors_email.find((auth_email) => {
            return auth_email == email;
        })
        return rr != undefined;
    });
    return res.render('books-magazines', { books: filtered_books, magazines: filtered_magazines });
})

//Add book to new csv
app.get('/add-books', (req, res) => {
    res.render('add-books');
})
app.post('/add-books', async (req, res) => {
    let { title, isbn, authors, description } = req.body;

    var writer;
    if (fs.existsSync('new_books.csv')) {
        writer = csvWriter({sendHeaders: false});
    } else {
        writer = csvWriter()
    }
    writer.pipe(fs.createWriteStream('new_books.csv', { flags: 'a' }))
    writer.write({title, isbn, authors, description});
    writer.end()
    return res.status(200).json({ "message": "Successfully saved record to csv file" });
})

//Add book to new magazines
app.get('/add-magazines', (req, res) => {
    res.render('add-magazines');
})
app.post('/add-magazines', async (req, res) => {
    let { title, isbn, authors, publishedAt } = req.body;

    var writer;
    if (fs.existsSync('new_magazines.csv')) {
        writer = csvWriter({sendHeaders: false});
    } else {
        writer = csvWriter();
    }
    writer.pipe(fs.createWriteStream('new_magazines.csv', { flags: 'a' }))
    writer.write({title, isbn, authors, publishedAt});
    writer.end()
    return res.status(200).json({ "message": "Successfully saved record to csv file" });
})

app.listen(PORT, () => {
    console.log(`Server listening on: ${PORT}`);
})