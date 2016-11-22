REPORTER = $(if $(CI),spec,dot)

build: node_modules/

test: node_modules/ build lint
	./node_modules/phantomjs-prebuilt/bin/phantomjs ./node_modules/mocha-phantomjs-core/mocha-phantomjs-core.js \
		./test/test.html $(REPORTER) '{"useColors":true}'

lint: node_modules/
	./node_modules/.bin/eslint .

node_modules/:
	npm install

clean:
	rm -rf ./node_modules

.PHONY: build clean lint test
