/**
 * PrismaClient-compatible database layer using sql.js (pure JS SQLite via WASM)
 * Provides the same API surface as Prisma Client for SQLite
 */
const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

function generateCuid() {
  return "c" + crypto.randomBytes(12).toString("hex");
}

const DB_PATH = path.resolve(process.cwd(), "prisma", "dev.db");

let _db = null;
let _SQL = null;
let _initPromise = null;

function saveDb() {
  if (_db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const data = _db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

async function ensureInit() {
  if (_db) return;
  if (_initPromise) return _initPromise;
  
  _initPromise = (async () => {
    _SQL = await initSqlJs();
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      _db = new _SQL.Database(fileBuffer);
    } else {
      _db = new _SQL.Database();
    }
    
    _db.run("PRAGMA journal_mode = WAL");
    _db.run("PRAGMA foreign_keys = ON");
    initSchema();
    saveDb();
  })();
  
  return _initPromise;
}

function initSchema() {
  _db.run(`
    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      name TEXT,
      role TEXT DEFAULT 'CUSTOMER',
      status INTEGER DEFAULT 1,
      phone TEXT,
      address TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS Category (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS Brand (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS Product (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      discount REAL DEFAULT 0,
      discountPrice REAL,
      sku TEXT UNIQUE,
      stock INTEGER DEFAULT 0,
      images TEXT DEFAULT '[]',
      size TEXT DEFAULT '[]',
      color TEXT DEFAULT '[]',
      status TEXT DEFAULT 'ACTIVE',
      averageRating REAL DEFAULT 0,
      reviewCount INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      specifications TEXT DEFAULT '{}',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      sellerId TEXT NOT NULL REFERENCES User(id),
      categoryId TEXT REFERENCES Category(id),
      brandId TEXT REFERENCES Brand(id)
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS Cart (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL REFERENCES User(id),
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS CartItem (
      id TEXT PRIMARY KEY,
      cartId TEXT NOT NULL REFERENCES Cart(id) ON DELETE CASCADE,
      productId TEXT NOT NULL REFERENCES Product(id),
      quantity INTEGER DEFAULT 1,
      UNIQUE(cartId, productId)
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS "Order" (
      id TEXT PRIMARY KEY,
      orderNumber TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'PENDING',
      paymentStatus TEXT DEFAULT 'PENDING',
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      shipping REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL NOT NULL,
      shippingAddress TEXT DEFAULT '',
      orderDate TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      userId TEXT NOT NULL REFERENCES User(id),
      sellerId TEXT NOT NULL REFERENCES User(id)
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS OrderItem (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
      productId TEXT NOT NULL REFERENCES Product(id),
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      total REAL NOT NULL
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS Review (
      id TEXT PRIMARY KEY,
      rating INTEGER NOT NULL,
      comment TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      userId TEXT NOT NULL REFERENCES User(id),
      productId TEXT NOT NULL REFERENCES Product(id) ON DELETE CASCADE,
      UNIQUE(userId, productId)
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS Wishlist (
      id TEXT PRIMARY KEY,
      userId TEXT UNIQUE NOT NULL REFERENCES User(id),
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS WishlistItem (
      id TEXT PRIMARY KEY,
      wishlistId TEXT NOT NULL REFERENCES Wishlist(id) ON DELETE CASCADE,
      productId TEXT NOT NULL REFERENCES Product(id),
      UNIQUE(wishlistId, productId)
    )
  `);
}

// --- Helpers ---

function parseJsonFields(row, jsonFields) {
  if (!row) return row;
  const result = { ...row };
  for (const field of jsonFields) {
    if (result[field] !== undefined && result[field] !== null && typeof result[field] === "string") {
      try {
        result[field] = JSON.parse(result[field]);
      } catch (e) {
        // leave as-is
      }
    }
  }
  return result;
}

function serializeJsonFields(data, jsonFields) {
  const result = { ...data };
  for (const field of jsonFields) {
    if (result[field] !== undefined && typeof result[field] !== "string") {
      result[field] = JSON.stringify(result[field]);
    }
  }
  return result;
}

function intToBool(val) {
  return val === 1 || val === true;
}

function boolToInt(val) {
  return val ? 1 : 0;
}

// Relation definitions
const RELATIONS = {
  User: {
    products: { type: "list", table: "Product", foreignKey: "sellerId" },
    orders: { type: "list", table: "Order", foreignKey: "userId" },
    sellerOrders: { type: "list", table: "Order", foreignKey: "sellerId" },
    cart: { type: "one", table: "Cart", foreignKey: "userId" },
    wishlist: { type: "list", table: "Wishlist", foreignKey: "userId" },
    reviews: { type: "list", table: "Review", foreignKey: "userId" },
  },
  Product: {
    seller: { type: "one", table: "User", localKey: "sellerId", primaryKey: "id" },
    category: { type: "one", table: "Category", localKey: "categoryId", primaryKey: "id" },
    brand: { type: "one", table: "Brand", localKey: "brandId", primaryKey: "id" },
    orderItems: { type: "list", table: "OrderItem", foreignKey: "productId" },
    cartItems: { type: "list", table: "CartItem", foreignKey: "productId" },
    wishlistItems: { type: "list", table: "WishlistItem", foreignKey: "productId" },
    reviews: { type: "list", table: "Review", foreignKey: "productId" },
  },
  Category: {
    products: { type: "list", table: "Product", foreignKey: "categoryId" },
  },
  Brand: {
    products: { type: "list", table: "Product", foreignKey: "brandId" },
  },
  Cart: {
    user: { type: "one", table: "User", localKey: "userId", primaryKey: "id" },
    items: { type: "list", table: "CartItem", foreignKey: "cartId" },
  },
  CartItem: {
    cart: { type: "one", table: "Cart", localKey: "cartId", primaryKey: "id" },
    product: { type: "one", table: "Product", localKey: "productId", primaryKey: "id" },
  },
  Order: {
    user: { type: "one", table: "User", localKey: "userId", primaryKey: "id" },
    seller: { type: "one", table: "User", localKey: "sellerId", primaryKey: "id" },
    items: { type: "list", table: "OrderItem", foreignKey: "orderId" },
  },
  OrderItem: {
    order: { type: "one", table: "Order", localKey: "orderId", primaryKey: "id" },
    product: { type: "one", table: "Product", localKey: "productId", primaryKey: "id" },
  },
  Review: {
    user: { type: "one", table: "User", localKey: "userId", primaryKey: "id" },
    product: { type: "one", table: "Product", localKey: "productId", primaryKey: "id" },
  },
  Wishlist: {
    user: { type: "one", table: "User", localKey: "userId", primaryKey: "id" },
    items: { type: "list", table: "WishlistItem", foreignKey: "wishlistId" },
  },
  WishlistItem: {
    wishlist: { type: "one", table: "Wishlist", localKey: "wishlistId", primaryKey: "id" },
    product: { type: "one", table: "Product", localKey: "productId", primaryKey: "id" },
  },
};

const JSON_FIELDS = {
  Product: ["images", "size", "color", "specifications"],
};

const BOOL_FIELDS = {
  User: ["status"],
};

// Models that have updatedAt field
const MODELS_WITH_UPDATED_AT = new Set([
  "User", "Product", "Cart", "Order", "Review", "Wishlist",
]);

const TABLE_MAP = {
  User: "User",
  Category: "Category",
  Brand: "Brand",
  Product: "Product",
  Cart: "Cart",
  CartItem: "CartItem",
  Order: '"Order"',
  OrderItem: "OrderItem",
  Review: "Review",
  Wishlist: "Wishlist",
  WishlistItem: "WishlistItem",
};

function getTableName(model) {
  return TABLE_MAP[model] || model;
}

function transformRow(model, row) {
  if (!row) return null;
  let result = { ...row };
  const jsonFields = JSON_FIELDS[model] || [];
  result = parseJsonFields(result, jsonFields);
  const boolFields = BOOL_FIELDS[model] || [];
  for (const field of boolFields) {
    if (result[field] !== undefined) {
      result[field] = intToBool(result[field]);
    }
  }
  return result;
}

function transformInput(model, data) {
  if (!data) return data;
  let result = { ...data };
  const jsonFields = JSON_FIELDS[model] || [];
  result = serializeJsonFields(result, jsonFields);
  const boolFields = BOOL_FIELDS[model] || [];
  for (const field of boolFields) {
    if (result[field] !== undefined) {
      result[field] = boolToInt(result[field]);
    }
  }
  return result;
}

// --- Query helpers ---

function sqlAll(sql, params = []) {
  const stmt = _db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function sqlGet(sql, params = []) {
  const rows = sqlAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function sqlRun(sql, params = []) {
  _db.run(sql, params);
  saveDb();
  return { changes: _db.getRowsModified() };
}

function buildWhere(model, where, params, alias = "") {
  const conditions = [];
  const prefix = alias ? `${alias}.` : "";

  for (const [key, value] of Object.entries(where)) {
    if (key === "OR") {
      const orConditions = value.map((cond) => buildWhere(model, cond, params, alias));
      conditions.push(`(${orConditions.join(" OR ")})`);
    } else if (key === "AND") {
      const andConditions = value.map((cond) => buildWhere(model, cond, params, alias));
      conditions.push(`(${andConditions.join(" AND ")})`);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      for (const [op, opVal] of Object.entries(value)) {
        switch (op) {
          case "contains":
            conditions.push(`${prefix}${key} LIKE ?`);
            params.push(`%${opVal}%`);
            break;
          case "mode":
            break;
          case "gte":
            conditions.push(`${prefix}${key} >= ?`);
            params.push(opVal);
            break;
          case "lte":
            conditions.push(`${prefix}${key} <= ?`);
            params.push(opVal);
            break;
          case "gt":
            conditions.push(`${prefix}${key} > ?`);
            params.push(opVal);
            break;
          case "lt":
            conditions.push(`${prefix}${key} < ?`);
            params.push(opVal);
            break;
          case "in":
            if (Array.isArray(opVal) && opVal.length > 0) {
              const placeholders = opVal.map(() => "?").join(", ");
              conditions.push(`${prefix}${key} IN (${placeholders})`);
              params.push(...opVal);
            } else {
              conditions.push("1 = 0");
            }
            break;
          case "not":
            conditions.push(`${prefix}${key} != ?`);
            params.push(opVal);
            break;
          case "equals":
            conditions.push(`${prefix}${key} = ?`);
            params.push(opVal);
            break;
          default:
            break;
        }
      }
    } else {
      conditions.push(`${prefix}${key} = ?`);
      params.push(value);
    }
  }

  return conditions.join(" AND ");
}

function buildOrderBy(orderBy, alias = "") {
  const prefix = alias ? `${alias}.` : "";
  if (!orderBy) return "";
  if (typeof orderBy === "string") return `ORDER BY ${prefix}${orderBy}`;
  
  const parts = [];
  if (Array.isArray(orderBy)) {
    for (const item of orderBy) {
      for (const [key, dir] of Object.entries(item)) {
        parts.push(`${prefix}${key} ${dir.toUpperCase()}`);
      }
    }
  } else {
    for (const [key, dir] of Object.entries(orderBy)) {
      parts.push(`${prefix}${key} ${dir.toUpperCase()}`);
    }
  }
  return parts.length > 0 ? `ORDER BY ${parts.join(", ")}` : "";
}

// --- Model Delegate ---

function createModelDelegate(modelName) {
  const tableName = getTableName(modelName);
  const relations = RELATIONS[modelName] || {};

  function resolveIncludes(rows, include) {
    if (!include || !Array.isArray(rows)) return rows;
    if (!rows.length) return rows;
    
    for (const [relName, relConfig] of Object.entries(include)) {
      if (relName === "_count") continue;
      const rel = relations[relName];
      if (!rel) continue;

      const relModelName = rel.table.replace(/"/g, "");

      if (rel.type === "list") {
        for (const row of rows) {
          const relatedRows = sqlAll(`SELECT * FROM ${getTableName(rel.table)} WHERE ${rel.foreignKey} = ?`, [row.id]);
          let relatedItems = relatedRows.map((r) => transformRow(relModelName, r));
          
          if (typeof relConfig === "object" && relConfig.include) {
            relatedItems = resolveIncludes(relatedItems, relConfig.include);
          }
          row[relName] = relatedItems;
        }
      } else if (rel.type === "one") {
        for (const row of rows) {
          const localKey = rel.localKey || "id";
          const primaryKey = rel.primaryKey || "id";
          const fkValue = row[localKey];
          if (fkValue) {
            const relatedRow = sqlGet(`SELECT * FROM ${getTableName(rel.table)} WHERE ${primaryKey} = ?`, [fkValue]);
            row[relName] = relatedRow ? transformRow(relModelName, relatedRow) : null;
          } else {
            row[relName] = null;
          }
        }
      }
    }
    
    return rows;
  }

  function resolveIncludesSingle(row, include) {
    if (!include || !row) return row;
    const result = resolveIncludes([row], include);
    return result[0];
  }

  const delegate = {
    async findMany(args = {}) {
      await ensureInit();
      const params = [];
      let whereClause = "";
      if (args.where) {
        const cond = buildWhere(modelName, args.where, params);
        if (cond) whereClause = `WHERE ${cond}`;
      }
      const orderClause = buildOrderBy(args.orderBy);
      
      let limitStr = "";
      if (args.take !== undefined && args.skip !== undefined) {
        limitStr = `LIMIT ${args.take} OFFSET ${args.skip}`;
      } else if (args.take !== undefined) {
        limitStr = `LIMIT ${args.take}`;
      } else if (args.skip !== undefined) {
        limitStr = `LIMIT -1 OFFSET ${args.skip}`;
      }

      const sql = `SELECT * FROM ${tableName} ${whereClause} ${orderClause} ${limitStr}`;
      const rows = sqlAll(sql, params);
      let results = rows.map((r) => transformRow(modelName, r));
      
      if (args.include) {
        results = resolveIncludes(results, args.include);
        
        // Handle _count
        if (args.include._count) {
          for (const row of results) {
            row._count = {};
            for (const [countField, countConfig] of Object.entries(args.include._count.select || {})) {
              if (countConfig && relations[countField]) {
                const rel = relations[countField];
                if (rel.type === "list") {
                  const countRow = sqlGet(`SELECT COUNT(*) as count FROM ${getTableName(rel.table)} WHERE ${rel.foreignKey} = ?`, [row.id]);
                  row._count[countField] = countRow ? countRow.count : 0;
                }
              }
            }
          }
        }
      }
      
      return results;
    },

    async findFirst(args = {}) {
      const results = await delegate.findMany({ ...args, take: 1 });
      return results.length > 0 ? results[0] : null;
    },

    async findUnique(args) {
      return delegate.findFirst(args);
    },

    async create(args) {
      await ensureInit();
      let data = { ...args.data };
      
      const nestedCreates = [];
      
      // Handle connect relations and nested creates
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === "object" && value.connect) {
          const rel = relations[key];
          if (rel && rel.type === "one") {
            const localKey = rel.localKey || `${key}Id`;
            const connectData = value.connect;
            data[localKey] = connectData.id || Object.values(connectData)[0];
          }
          delete data[key];
        } else if (value && typeof value === "object" && value.create !== undefined) {
          const rel = relations[key];
          if (rel) {
            nestedCreates.push({ relName: key, rel, creates: Array.isArray(value.create) ? value.create : [value.create] });
          }
          delete data[key];
        }
      }

      if (!data.id) {
        data.id = generateCuid();
      }

      const now = new Date().toISOString();
      if (!data.createdAt) data.createdAt = now;
      if (MODELS_WITH_UPDATED_AT.has(modelName) && !data.updatedAt) data.updatedAt = now;

      data = transformInput(modelName, data);

      const cleanData = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && typeof value !== "object") {
          cleanData[key] = value;
        } else if (value === null) {
          cleanData[key] = null;
        }
      }

      const columns = Object.keys(cleanData);
      const placeholders = columns.map(() => "?").join(", ");
      const values = columns.map((c) => cleanData[c]);

      const sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`;
      sqlRun(sql, values);

      // Handle nested creates
      for (const { rel, creates } of nestedCreates) {
        const relTableName = getTableName(rel.table);
        const relModelName = rel.table.replace(/"/g, "");
        const relRelations = RELATIONS[relModelName] || {};
        
        for (const createItem of creates) {
          let itemData = { ...createItem };
          for (const [ik, iv] of Object.entries(itemData)) {
            if (iv && typeof iv === "object" && iv.connect) {
              const nestedRel = relRelations[ik];
              if (nestedRel && nestedRel.type === "one") {
                const localKey = nestedRel.localKey || `${ik}Id`;
                const connectData = iv.connect;
                itemData[localKey] = connectData.id || Object.values(connectData)[0];
              }
              delete itemData[ik];
            }
          }
          if (rel.foreignKey) {
            itemData[rel.foreignKey] = data.id;
          }
          if (!itemData.id) {
            itemData.id = generateCuid();
          }
          if (!itemData.createdAt) itemData.createdAt = now;
          if (MODELS_WITH_UPDATED_AT.has(relModelName) && !itemData.updatedAt) itemData.updatedAt = now;
          itemData = transformInput(relModelName, itemData);
          const cleanItem = {};
          for (const [k, v] of Object.entries(itemData)) {
            if (v !== undefined && typeof v !== "object") {
              cleanItem[k] = v;
            } else if (v === null) {
              cleanItem[k] = null;
            }
          }
          const itemCols = Object.keys(cleanItem);
          const itemPlaceholders = itemCols.map(() => "?").join(", ");
          const itemValues = itemCols.map((c) => cleanItem[c]);
          sqlRun(`INSERT INTO ${relTableName} (${itemCols.join(", ")}) VALUES (${itemPlaceholders})`, itemValues);
        }
      }

      const created = sqlGet(`SELECT * FROM ${tableName} WHERE id = ?`, [data.id]);
      let result = transformRow(modelName, created);

      if (args.include) {
        result = resolveIncludesSingle(result, args.include);
      }

      return result;
    },

    async update(args) {
      await ensureInit();
      let data = { ...args.data };
      
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === "object" && value.connect) {
          const rel = relations[key];
          if (rel && rel.type === "one") {
            const localKey = rel.localKey || `${key}Id`;
            const connectData = value.connect;
            data[localKey] = connectData.id || Object.values(connectData)[0];
          }
          delete data[key];
        }
      }

      const params = [];
      let whereClause = "";
      if (args.where) {
        const cond = buildWhere(modelName, args.where, params);
        if (cond) whereClause = `WHERE ${cond}`;
      }

      const setClauses = [];
      const setParams = [];
      
      for (const [key, value] of Object.entries(data)) {
        if (value === undefined) continue;
        if (key === "_increment") {
          if (typeof value === "object") {
            for (const [field, amount] of Object.entries(value)) {
              setClauses.push(`${field} = ${field} + ?`);
              setParams.push(amount);
            }
          }
          continue;
        }
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          if (value.increment !== undefined) {
            setClauses.push(`${key} = ${key} + ?`);
            setParams.push(value.increment);
            continue;
          }
          if (value.decrement !== undefined) {
            setClauses.push(`${key} = ${key} - ?`);
            setParams.push(value.decrement);
            continue;
          }
          continue;
        }
        setClauses.push(`${key} = ?`);
        setParams.push(value);
      }

      if (MODELS_WITH_UPDATED_AT.has(modelName)) {
        setClauses.push("updatedAt = ?");
        setParams.push(new Date().toISOString());
      }

      if (setClauses.length === 0) {
        const row = sqlGet(`SELECT * FROM ${tableName} ${whereClause}`, params);
        if (!row) throw new Error(`Record not found in ${modelName}`);
        let result = transformRow(modelName, row);
        if (args.include) result = resolveIncludesSingle(result, args.include);
        return result;
      }

      const allParams = [...setParams, ...params];
      const sql = `UPDATE ${tableName} SET ${setClauses.join(", ")} ${whereClause}`;
      sqlRun(sql, allParams);

      const row = sqlGet(`SELECT * FROM ${tableName} ${whereClause}`, params);
      if (!row) throw new Error(`Record not found in ${modelName}`);
      let result = transformRow(modelName, row);
      
      if (args.include) {
        result = resolveIncludesSingle(result, args.include);
      }

      return result;
    },

    async delete(args) {
      await ensureInit();
      const params = [];
      let whereClause = "";
      if (args.where) {
        const cond = buildWhere(modelName, args.where, params);
        if (cond) whereClause = `WHERE ${cond}`;
      }

      const row = sqlGet(`SELECT * FROM ${tableName} ${whereClause}`, params);
      if (!row) throw new Error(`Record not found in ${modelName}`);

      sqlRun(`DELETE FROM ${tableName} ${whereClause}`, params);
      
      let result = transformRow(modelName, row);
      if (args.include) {
        result = resolveIncludesSingle(result, args.include);
      }
      return result;
    },

    async deleteMany(args = {}) {
      await ensureInit();
      const params = [];
      let whereClause = "";
      if (args.where) {
        const cond = buildWhere(modelName, args.where, params);
        if (cond) whereClause = `WHERE ${cond}`;
      }

      const result = sqlRun(`DELETE FROM ${tableName} ${whereClause}`, params);
      return { count: result.changes };
    },

    async count(args = {}) {
      await ensureInit();
      const params = [];
      let whereClause = "";
      if (args.where) {
        const cond = buildWhere(modelName, args.where, params);
        if (cond) whereClause = `WHERE ${cond}`;
      }

      const row = sqlGet(`SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`, params);
      return row.count;
    },

    async aggregate(args = {}) {
      await ensureInit();
      const params = [];
      let whereClause = "";
      if (args.where) {
        const cond = buildWhere(modelName, args.where, params);
        if (cond) whereClause = `WHERE ${cond}`;
      }

      const result = {};
      
      if (args._sum) {
        result._sum = {};
        for (const field of Object.keys(args._sum)) {
          const row = sqlGet(`SELECT SUM(${field}) as sum FROM ${tableName} ${whereClause}`, params);
          result._sum[field] = row ? row.sum : null;
        }
      }
      
      if (args._avg) {
        result._avg = {};
        for (const field of Object.keys(args._avg)) {
          const row = sqlGet(`SELECT AVG(${field}) as avg FROM ${tableName} ${whereClause}`, params);
          result._avg[field] = row ? row.avg : null;
        }
      }

      if (args._count) {
        const row = sqlGet(`SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`, params);
        result._count = row ? row.count : 0;
      }

      return result;
    },

    async upsert(args) {
      const existing = await delegate.findFirst({ where: args.where });
      if (existing) {
        return delegate.update({ where: args.where, data: args.update });
      } else {
        return delegate.create({ data: args.create, include: args.include });
      }
    },
  };

  return delegate;
}

// --- PrismaClient ---

class PrismaClient {
  constructor(options = {}) {
    this._datasourceUrl = options.datasources?.db?.url || process.env.DATABASE_URL;
    this._initPromise = ensureInit();
    
    this.user = createModelDelegate("User");
    this.category = createModelDelegate("Category");
    this.brand = createModelDelegate("Brand");
    this.product = createModelDelegate("Product");
    this.cart = createModelDelegate("Cart");
    this.cartItem = createModelDelegate("CartItem");
    this.order = createModelDelegate("Order");
    this.orderItem = createModelDelegate("OrderItem");
    this.review = createModelDelegate("Review");
    this.wishlist = createModelDelegate("Wishlist");
    this.wishlistItem = createModelDelegate("WishlistItem");
  }

  async $connect() {
    await ensureInit();
  }

  async $disconnect() {
    if (_db) {
      saveDb();
      _db.close();
      _db = null;
      _initPromise = null;
    }
  }

  async $transaction(fnOrOps) {
    await ensureInit();
    if (typeof fnOrOps === "function") {
      return fnOrOps(this);
    }
    const results = [];
    for (const op of fnOrOps) {
      results.push(await op);
    }
    return results;
  }

  $executeRaw(strings, ...values) {
    const sql = typeof strings === "string" ? strings : strings.join("?");
    return sqlRun(sql, values);
  }

  $queryRaw(strings, ...values) {
    const sql = typeof strings === "string" ? strings : strings.join("?");
    return sqlAll(sql, values);
  }
}

module.exports = { PrismaClient, ensureInit };
