REPORTER = $(if $(CI),spec,dot)

ifeq ($(TRAVIS),)
build: node_modules/
else
PATH := $(PWD)/phantomjs/bin:$(PATH)
build: node_modules/ phantomjs/bin/phantomjs
endif

test: node_modules/ build lint
	phantomjs ./node_modules/mocha-phantomjs-core/mocha-phantomjs-core.js \
		./test/test.html $(REPORTER) '{"useColors":true}'

lint: node_modules/
	./node_modules/.bin/eslint .

node_modules/:
	npm install

phantomjs/bin/phantomjs:
	mkdir -p phantomjs
	wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2 -O- | \
		tar xj -C phantomjs --strip-components 1

clean:
	rm -rf ./node_modules phantomjs

.PHONY: build clean lint test
