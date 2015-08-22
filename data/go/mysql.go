package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"sync"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

import "C"

var db *sqlx.DB

//export Connect
func Connect(uri string) string {
	if db != nil {
		return "Connection already open"
	}
	c, err := sqlx.Open("mysql", uri)
	if err != nil {
		return err.Error()
	}
	if err := c.Ping(); err != nil {
		return err.Error()
	}
	db = c
	return "OK"
}

//export Disconnect
func Disconnect() string {
	defer func() {
		db = nil
	}()
	if db == nil {
		return "No connection to close"
	}
	if err := db.Close(); err != nil {
		return err.Error()
	}
	return "OK"
}

//export SelectQuery
func SelectQuery(q string) (string, string) {
	if db == nil {
		return "", "No connection"
	}

	maps := make([]map[string]interface{}, 0)

	rows, err := db.Queryx(q)
	if err != nil {
		return "", err.Error()
	}
	for rows.Next() {
		out := map[string]interface{}{}
		err := rows.MapScan(out)
		if err != nil {
			return "", err.Error()
		}

		var wg sync.WaitGroup
		wg.Add(1)
		// test that goroutines work
		go func() {
			defer wg.Done()
			for k, v := range out {
				if b, ok := v.([]byte); ok {
					out[k] = string(b)
				}
			}
		}()
		wg.Wait()
		maps = append(maps, out)
	}

	bytes, err := json.MarshalIndent(maps, "", "  ")
	if err != nil {
		return "", err.Error()
	}
	return string(bytes), ""
}

//export Blah
func Blah() (string, error) {
	return "", errors.New("test")
}

func main() {
	(Connect("root:root@/mysql"))
	fmt.Println(SelectQuery("SELECT * FROM user"))
	(Disconnect())
}
