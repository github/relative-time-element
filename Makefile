lint: node_modules/
	./node_modules/.bin/jshint *.js

bower_components/: node_modules/
	./node_modules/.bin/bower install

node_modules/:
	npm install

.PHONY: lint
