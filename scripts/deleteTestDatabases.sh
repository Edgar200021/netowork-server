DATABASE_URL=$(grep -E '^DATABASE_URL=' .env | cut -d '=' -f2 | tr -d '"')

if [[ -z "$DATABASE_URL" ]]; then
  echo "Error: DATABASE_URL not found in .env"
  exit 1
fi

DB_USER=$(echo $DATABASE_URL | sed -E 's|.*://([^:]+):.*|\1|')
DB_PASSWORD=$(echo $DATABASE_URL | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')
DB_HOST=$(echo $DATABASE_URL | sed -E 's|.*@([^:/]+).*|\1|')
DB_PORT=$(echo $DATABASE_URL | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_NAME=$(echo $DATABASE_URL | sed -E 's|.*/([^/?]+).*|\1|')

export PGPASSWORD=$DB_PASSWORD
DB_LIST=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -t -c "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres', 'template0', 'template1', '$DB_NAME');")

UUID_REGEX='^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'

for DB in $DB_LIST; do
  if [[ $DB =~ $UUID_REGEX ]]; then
    echo "Database deleting: $DB"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE \"$DB\";"
  else
    echo "Skipping non-UUID database: $DB"
  fi
done

echo "UUID databases deleted."