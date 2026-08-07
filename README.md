# IBM Architecture Guidelines

Personal reference notes covering HA & DR architecture, operational runbooks, and sizing guidance across IBM data platform products.

**Live site:** https://adhityaraar.github.io/architecture-guidelines/

---

## Contents

| Section | Description |
|---|---|
| **General** | HA & DR principles, RPO/RTO frameworks, IBM IPLA licensing, severity guide |
| **DB2** | HADR configuration, sync modes, takeover, log shipping, monitoring, commands, simulator, diagnostics, sizing |
| **InfoSphere** | DataStage parallel engine HA, CDC subscription topology, recovery procedures |
| **watsonx.data** | Lakehouse engines & catalogs, Integration pipelines, Intelligence Knowledge Catalog |
| **Guardium** | Data Protection (S-TAP/Collector HA), Discover & Classify, Cryptography Manager |

---

## DB2 HADR

The DB2 section covers IBM Db2 High Availability Disaster Recovery (HADR) in depth — topology, sync modes, ACR, monitoring, failover runbooks, PureScale, and the HADR simulator tool.

For the full upstream IBM DB2 HADR Wiki, see:

> **https://github.com/IBM/db2-hadr-wiki/tree/master**

That repository is maintained by IBM and contains the authoritative source material that this reference is based on.

---

## Structure

```
architecture/
├── index.html                          # Home dashboard
├── general/                            # General HA & DR principles
├── db2/                                # DB2 HADR wiki pages
├── InfoSphere/
│   ├── DataStage/                      # DataStage HA pages
│   └── Change Data Capture/            # CDC HA pages
├── watsonx.data/                       # Lakehouse HA guide
├── watsonx.data Integration/           # Integration HA pages
├── watsonx.data Intelligence/          # Intelligence HA pages
├── Guardium/
│   ├── Guardium Data Protection/
│   ├── Guardium Discover and Classify/
│   └── Guardium Crytography Manager/
├── css/wiki.css                        # Shared stylesheet
├── js/wiki.js                          # Shared scripts (search, sidebar, accordion)
├── search-index.json                   # Full-content search index
└── build-search-index.js               # Script to rebuild search-index.json
```

---

## Rebuilding the Search Index

After editing any page content, regenerate the search index and re-inject it into all pages:

```bash
node build-search-index.js
```

---

*Audience: Architects, DBAs, Platform Engineers*
*Products: IBM Db2, DataStage, CDC, watsonx.data, Guardium*
