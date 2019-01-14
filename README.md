## CryptoManager

This is a fully featured multi cryptocurrency RESTful application to manage funds from different crypto currencies using a single mnemonic seed. 

## Example

Getting an addresses 

```bash
    $curl -X GET http://localhost:2121/2
```

will yield the following response:
```json
{
	"eth": {
		"address": "0x879640A080fFbeBF3E31D7D0d34ba4b223f8a84D"
	},
	"ltc": {
		"address": "LU1D7pdQA3wb3kNcxH1W86zovhH2RcShTx"
	},
	"xrp": {
		"address": "rp4rFSJgR6CAcR9LSRJRR2NtYFGnaSwNty"
	}
}
```

## Installation

You'll first need to generate a .addresses.json file in each respective server's folder. Tweak the amount of addresses you need and execute generate_addresses.js

If you're running all of the full nodes on different servers make sure you port forward all the necessary servers.

Then run npm start. You can choose a port of your own if not it will choose port 2121.

## API Reference

**Get address**
----
  Returns json data including all addresses.

* **URLs**

  /:index
  
  /:index/:currency

* **Method:**

  `GET`
  
*  **URL Params**

   **Required:**
 
   `index=[integer]`
   
   **Optional:**
   
   `currency=[eth|ltc|xrp]`

* **Success Response:**

  * **Code:** `200` <br />

* **Example Return Value:** 

```json 
{
	"eth": {
		"address": "0x879640A080fFbeBF3E31D7D0d34ba4b223f8a84D"
	},
	"ltc": {
		"address": "LU1D7pdQA3wb3kNcxH1W86zovhH2RcShTx"
	},
	"xrp": {
		"address": "rp4rFSJgR6CAcR9LSRJRR2NtYFGnaSwNty"
	}
}
```
 
* **Error Responses:**

  * **Code:** `404 NOT FOUND` <br />

  * **Content:** 
  
      ```json 
      { "error" : "Not found" }
      ```

**Get an acccount's balances**
----
  Returns json data including that account's balances.

* **URLs**

  /:index/:currency/balance
  
  /:index/balance 

* **Method:**

  `GET`
  
*  **URL Params**

   **Required:**
 
   `index=[integer]`
   
   **Optional:**
   
   `currency=[eth|ltc|xrp]

* **Success Response:**

  * **Code:** `200` <br />

* **Example Return Value:** 

```json 
{
	"eth": {
		"deposits": "0",
		"withdrawals": "0",
		"fees": "0",
		"balance": "0"
	},
	"ltc": {
		"deposits": "0",
		"withdrawals": "0",
		"fees": "0",
		"balance": "0"
	},
	"xrp": {
		"deposits": "0",
		"withdrawals": "0",
		"fees": "0",
		"balance": "0"
	}
}
```
 
* **Error Response:**

  * **Code:** `404 NOT FOUND` <br />
  
    **Content:** 
    
        `{ "error" : "Not found" }`


**Get an acccount's transactions**
----
  Returns json data including that account's transactions.

* **URLs**

  /:index/:currency/transactions
  
  /:index/:currency/deposits
  
  /:index/:currency/withdrawals
  
  /:index/transactions 
  
  /:index/deposits
  
  /:index/withdrawals

* **Method:**

  `GET`
  
*  **URL Params**

   **Required:**
 
   `index=[integer]`
   
   **Optional:**
   
   `currency=[eth|ltc|xrp]`

* **Success Response:**

  * **Code:** `200` <br />

* **Example Return Value:** 
```json 
{
	"xrp": [
		{
			"txid": "8c1d513971c9249baa33c8d7e31089c1acd581f153a50998214b41797420c14b",
			"block": null,
			"created": 1500931080000,
			"from": "rDCgaaSBAWYfsxUYhCk1n26Na7x8PQGmkq",
			"to": "r4fKawiUGQ5XRM1Mp9GMrMy52e1712nBah",
			"value": "29850000",
			"currency": "xrp",
			"fee": "150000",
			"confirmations": 0
		}
	],
	"eth": [],
	"ltc": []
}
```
 
* **Error Response:**

  * **Code:** `404 NOT FOUND` <br />
  
  * **Content:** 

    ```json
    { "error" : "Not found" }
    ```

## Tests

No tests as of yet

## Contributors

[Matt Burton](https://github.com/burtonium)
