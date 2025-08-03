import SQLiteStorage, {
  SQLiteDatabase, 
  ResultSet
} from 'react-native-sqlite-storage';
import { Platform } from 'react-native';

SQLiteStorage.DEBUG(__DEV__);
SQLiteStorage.enablePromise(true);

export type TableField = {
  columnName: string;
  dataType: string;
};

export type TableInfo = {
  tableName: string;
  tableFields: TableField[];
};

export type Item = { [key: string]: string | number };
export type Condition = { [key: string]: string | number };
export type Formatter = (row: any, index: number) => any;

export default class SQLite {
  private db: SQLiteDatabase | null = null;
  private databaseName: string;
  private databaseLocation: string;
  private successInfo: (text: string, msg: any) => void;
  private errorInfo: (text: string, err: any) => void;
  static emptyResultSet: ResultSet = {
    insertId: 0, rowsAffected: 0,
    rows: { length: 0,raw: () => [],
            item: (index: number) => { throw new Error("Index out of bounds: ResultSet is empty"); },},
  };

  async delete(database: string): Promise<void> {
    try {
      SQLiteStorage.deleteDatabase({
        name: database,           // name of your database file 
      });
    } catch (err) {
      this.errorInfo('delete', err);
    }
  }

  constructor(databaseName: string, databaseLocation: string) {
    this.databaseName = databaseName;
    this.databaseLocation = databaseLocation;

    this.successInfo = (text, absolutely = false) => {
      if (__DEV__) {
        console.log(absolutely ? text : `SQLiteHelper ${text} success.`);
      }
    };

    this.errorInfo = (text, err, absolutely = false) => {
      if (__DEV__) {
        console.log(
          absolutely
            ? text
            : `SQLiteHelper ${text} error: ${err?.message ?? err}`
        );
      }
    };

    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.createTable = this.createTable.bind(this);
    this.dropTable = this.dropTable.bind(this);
    this.insertItem = this.insertItem.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.updateItem = this.updateItem.bind(this);
    this.selectItems = this.selectItems.bind(this);
    this.queryItems = this.queryItems.bind(this);
  }

  async open(): Promise<void> {
    const opts =
      Platform.OS === 'ios'
        ? { name: this.databaseName, location: this.databaseLocation }
        : {
            name: this.databaseName,
            createFromLocation: this.databaseName,
          };

    try {
      const db = await SQLiteStorage.openDatabase(opts);
      this.db = db;
      this.successInfo('open database', this.databaseName);
    } catch (err) {
      this.errorInfo('open database', err);
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      try {
        await this.db.close();
        this.successInfo('close db', this.databaseName);
        this.db = null;
      } catch (err) {
        this.errorInfo('close', err);
      }
    }
    this.successInfo('database has not opened', this.databaseName);
  }

  async createTable(tableInfo: TableInfo): Promise<[ResultSet]> {
    const { tableName, tableFields } = tableInfo;
    if (!this.db) await this.open();

    const sqlStr = tableFields.reduce((sql, field, index, arr) => {
      return `${sql} ${field.columnName} ${field.dataType}${
        index + 1 === arr.length ? ');' : ','
      }`;
    }, `CREATE TABLE IF NOT EXISTS ${tableName}(`);

    try {
      const res = await this.db!.executeSql(sqlStr);
      this.successInfo('createTable', tableName);
      return res ;
    } catch (err) {
      this.errorInfo('createTable', err);
      return [SQLite.emptyResultSet];
    }
  }

  async dropTable(tableName: string): Promise<[ResultSet]> {
    if (!this.db) await this.open();

    try {
      const res = await this.db!.executeSql(`DROP TABLE ${tableName};`);
      this.successInfo('dropTable', tableName);
      return res;
    } catch (err) {
      this.errorInfo('dropTable', err);
      return [SQLite.emptyResultSet];
    }
  }

  async insertItem(tableName: string, item: Item): Promise<boolean> {
    if (!this.db) await this.open();

    const keys = Object.keys(item); // ['title', 'uri', 'poster', 'stroke', 'drawdata']
    const values = Object.values(item); // values in same order
    const placeholders = keys.map(() => '?').join(', '); // "?, ?, ?, ?, ?"
    const sqlStr = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
    if (__DEV__) { console.log("Sql statement ", sqlStr, values); }
    try {
      const res = await this.db!.executeSql(sqlStr, values);
      this.successInfo(`SQLiteStorage addItems success: affected ${res[0].rowsAffected} rows`, tableName);
      return true;
    } catch (err) {
      this.errorInfo('insertItem', err);
      return false;
    }
  }

  async deleteItem(tableName: string, condition?: Condition): Promise<boolean> {
    if (!this.db) await this.open();

    let sqlStr: string;

    if (condition && Object.keys(condition).length > 0) {
      const where = Object.entries(condition)
        .map(([k, v]) => `${k}='${v}'`)
        .join(' and ');
      sqlStr = `DELETE FROM ${tableName} WHERE ${where};`;
    } else {
      sqlStr = `DELETE FROM ${tableName};`;
    }

    if (__DEV__) { console.log("Sql statement ", sqlStr); }
    try {
      const res = await this.db!.executeSql(sqlStr);
      this.successInfo(`SQLiteStorage deleteItem success: affected ${res[0].rowsAffected} rows`, tableName);
      return true;
    } catch (err) {
      this.errorInfo('deleteItem', err);
      return false;
    }
  }

  async updateItem(tableName: string, item: Item, condition?: Condition[]): Promise<[ResultSet]> {
    if (!this.db) await this.open();

    const setClause = Object.entries(item)
      .map(([k, v]) => `${k}='${v}'`)
      .join(', ');

    let sqlStr = `UPDATE ${tableName} SET ${setClause}`;

    if (condition && Object.keys(condition).length > 0) {
      const where = Object.entries(condition)
        .map(([k, v]) => `${k}='${v}'`)
        .join(' AND ');
      sqlStr += ` WHERE ${where};`;
    } else {
      sqlStr += ';';
    }

    try {
      const res = await this.db!.executeSql(sqlStr);
      this.successInfo(`SQLiteStorage updateItem success: affected ${res[0].rowsAffected} rows`, tableName);
      return res;
    } catch (err) {
      this.errorInfo('updateItem', err);
      return [SQLite.emptyResultSet];
    }
  }

  async queryItems(tableName: string, condition?: Condition): Promise<[ResultSet]> {
    if (!this.db) await this.open();

    let sqlStr = 'SELECT DISTINCT * FROM ';
    sqlStr += `${tableName}`;
    if (condition && Object.keys(condition).length > 0) {
      const where = Object.entries(condition)
        .map(([k, v]) => `${k}='${v}'`)
        .join(' AND ');
      sqlStr += ` WHERE ${where};`;
    } else {
      sqlStr += ';';
    }

    if (__DEV__) { console.log('queryItems', sqlStr); }
    try {
      const res = await this.db!.executeSql(sqlStr);
      this.successInfo(`SQLiteStorage queryItems success: ${res[0].rows.length}`, true);
      return res;
    } catch (err) {
      this.errorInfo('queryItems', err);
      return [SQLite.emptyResultSet];
    }
  }

  async selectItems(tableName: string, columns: string[] | '*', condition?: Condition, 
                    pagination?: number, perPageNum?: number, orderby?: string): Promise<[ResultSet]> {
    if (!this.db) await this.open();

    let sqlStr = 'SELECT DISTINCT ';

    if (columns === '*') {
      sqlStr += '*';
    } else {
      sqlStr += columns.join(', ');
    }

    sqlStr += ` FROM ${tableName}`;

    if (condition && Object.keys(condition).length > 0) {
      const where = Object.entries(condition)
        .map(([k, v]) => `${k}='${v}'`)
        .join(' AND ');
      sqlStr += ` WHERE ${where};`;
    } 

    if (orderby) {
      sqlStr += ' ORDER BY ' + orderby;
    }

    if (pagination && perPageNum) {
      const limit = pagination * perPageNum;
      const offset = (pagination - 1) * perPageNum;
      sqlStr += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    sqlStr += ';';

    if (__DEV__) console.log(sqlStr);

    try {
      const res = await this.db!.executeSql(sqlStr);
      this.successInfo(`SQLiteStorage selectItems success: ${res[0].rows.length}`, tableName);
      return res;
    } catch (err) {
      this.errorInfo('selectItems', err);
      return [SQLite.emptyResultSet];
    }
  }
}
