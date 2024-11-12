DBDOCS_VERSION?=0.1.0 # or "latest"

.PHONY: all
all: dbdocs

dbdocs: dbdocs.tgz
	@mkdir -p dbdocs-new
	@tar xzf dbdocs.tgz -C dbdocs-new --strip-components=1
	@test "MIT" = $$(jq -r .license dbdocs-new/package.json)
	@2>/dev/null rm -r dbdocs||true
	@mv dbdocs-new dbdocs

dbdocs.tgz:
	@wget -O dbdocs.tgz $$(docker run --rm node:alpine \
		npm view dbdocs@$(DBDOCS_VERSION) dist.tarball | head -n 1 \
	)

.PHONY: tag
tag:
	git add -f . && git stash
	@git tag "$$(jq -r .version dbdocs/package.json)" --sign
