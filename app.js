const express = require('express');
const mysql = require('mysql2/promise');
const hbs = require('hbs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecommerce_inventory'
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

// Helper for handlebars to format price
hbs.registerHelper('formatPrice', function(price) {
    return parseFloat(price).toFixed(2);
});

// Helper for comparison
hbs.registerHelper('eq', function(a, b) {
    return a === b;
});

// ======================
// ROUTES - PRODUCTS CRUD
// ======================

// READ: Display all products
app.get('/', async (req, res) => {
    try {
        const [products] = await pool.query(`
            SELECT p.*, c.category_name, s.supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
            ORDER BY p.product_id DESC
        `);
        
        res.render('products/index', { 
            title: 'Product Inventory',
            products: products 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching products');
    }
});

// READ: Search products with multiple filters
app.get('/products/search', async (req, res) => {
    try {
        const { category_id, min_price, max_price, keyword } = req.query;
        
        // Build dynamic query with multiple filters
        let query = `
            SELECT p.*, c.category_name, s.supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
            WHERE 1=1
        `;
        const params = [];
        
        // Filter by category
        if (category_id) {
            query += ' AND p.category_id = ?';
            params.push(category_id);
        }
        
        // Filter by price range (2 criteria: min and max)
        if (min_price) {
            query += ' AND p.price >= ?';
            params.push(parseFloat(min_price));
        }
        if (max_price) {
            query += ' AND p.price <= ?';
            params.push(parseFloat(max_price));
        }
        
        // Filter by keyword
        if (keyword) {
            query += ' AND (p.product_name LIKE ? OR p.description LIKE ?)';
            params.push(`%${keyword}%`, `%${keyword}%`);
        }
        
        query += ' ORDER BY p.product_id DESC';
        
        const [products] = await pool.query(query, params);
        const [categories] = await pool.query('SELECT * FROM categories ORDER BY category_name');
        
        res.render('products/index', { 
            title: 'Search Results',
            products: products,
            categories: categories,
            searchParams: req.query
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error searching products');
    }
});

// CREATE: Display form to add new product
app.get('/products/create', async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT * FROM categories ORDER BY category_name');
        const [suppliers] = await pool.query('SELECT * FROM suppliers ORDER BY supplier_name');
        
        res.render('products/create', {
            title: 'Add New Product',
            categories: categories,
            suppliers: suppliers
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading form');
    }
});

// CREATE: Process form to add new product (INSERT)
app.post('/products/create', async (req, res) => {
    try {
        const { product_name, description, price, stock_quantity, category_id, supplier_id } = req.body;
        
        await pool.query(`
            INSERT INTO products (product_name, description, price, stock_quantity, category_id, supplier_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [product_name, description, parseFloat(price), parseInt(stock_quantity), category_id || null, supplier_id || null]);
        
        res.redirect('/?message=Product added successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating product');
    }
});

// UPDATE: Display form to edit existing product
app.get('/products/edit/:id', async (req, res) => {
    try {
        const [products] = await pool.query('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
        
        if (products.length === 0) {
            return res.status(404).send('Product not found');
        }
        
        const [categories] = await pool.query('SELECT * FROM categories ORDER BY category_name');
        const [suppliers] = await pool.query('SELECT * FROM suppliers ORDER BY supplier_name');
        
        res.render('products/edit', {
            title: 'Edit Product',
            product: products[0],
            categories: categories,
            suppliers: suppliers
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading edit form');
    }
});

// UPDATE: Process form to update product
app.post('/products/edit/:id', async (req, res) => {
    try {
        const { product_name, description, price, stock_quantity, category_id, supplier_id } = req.body;
        
        await pool.query(`
            UPDATE products 
            SET product_name = ?, description = ?, price = ?, stock_quantity = ?, 
                category_id = ?, supplier_id = ?
            WHERE product_id = ?
        `, [product_name, description, parseFloat(price), parseInt(stock_quantity), 
            category_id || null, supplier_id || null, req.params.id]);
        
        res.redirect('/?message=Product updated successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating product');
    }
});

// DELETE: Display confirmation page
app.get('/products/delete/:id', async (req, res) => {
    try {
        const [products] = await pool.query('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
        
        if (products.length === 0) {
            return res.status(404).send('Product not found');
        }
        
        res.render('products/delete', {
            title: 'Delete Product',
            product: products[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading delete confirmation');
    }
});

// DELETE: Process deletion
app.post('/products/delete/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE product_id = ?', [req.params.id]);
        res.redirect('/?message=Product deleted successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting product');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Database connected to:', dbConfig.database);
});
