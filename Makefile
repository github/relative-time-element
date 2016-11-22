build: node_modules/

test: node_modules/ build lint
	node ./node_modules/.bin/node-qunit-phantomjs ./test/test.html

lint: node_modules/
	./node_modules/.bin/eslint *.js test/*.js

node_modules/:
	npm install

clean:
	rm -rf ./node_modules

.PHONY: build clean lint test
