test: node_modules/ lint
	./node_modules/.bin/phantomjs ./test/runner.js ./test/test.html

lint: node_modules/
	./node_modules/.bin/jshint *.js test/*.js

bower_components/: node_modules/
	./node_modules/.bin/bower install

node_modules/:
	npm install

.PHONY: lint test
