-- Role: joe

-- DROP ROLE joe;

CREATE ROLE joe LOGIN
  ENCRYPTED PASSWORD  XXXXX
  NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE NOREPLICATION;