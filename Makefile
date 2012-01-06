TITLE="Marmalade Documentation"

default: doc

clean:
	rm -rf man README.html

# This only works with the Ruby ronn at time of writing, which is really fine
# because the JS one is pretty bare-bones.
RONN=ronn --pipe

CODE=$(shell find lib/ -name '*.js')

man/code.html: ${CODE}
	mkdir -p html
	dox --title ${TITLE} $^ > $@

README.html: man/man7/marmalade.7
	ln -sf $^.html $@

man/man1/%: doc/%.md
	mkdir -p `dirname $@`
	${RONN} -r $^ > $@
	${RONN} -5 $^ > $@.html

man/man5/%: doc/%.md
	mkdir -p `dirname $@`
	${RONN} -r $^ > $@
	${RONN} -5 $^ > $@.html

man/man7/%: doc/%.md
	mkdir -p `dirname $@`
	${RONN} -r $^ > $@
	${RONN} -5 $^ > $@.html

doc: README.html man/code.html man/man7/marmalade.7 man/man1/marmalade.1 man/man7/api.7 man/man5/package.5
	rm -rf lib/public/doc-files
	cp -r man lib/public/doc-files
