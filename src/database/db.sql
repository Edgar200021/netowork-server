CREATE TYPE role AS ENUM ('admin', 'freelancer', 'customer');
CREATE TYPE order_status AS ENUM ('closed', 'in_process', 'new');
CREATE TYPE transaction_status AS ENUM ('accepted', 'rejected', 'new');
CREATE TYPE reply_status AS ENUM ('accepted', 'rejected', 'new', 'considered');


CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY,
                            name TEXT NOT NULL,
                            last_name TEXT NOT NULL,
                            email TEXT NOT NULL UNIQUE,
                            password TEXT,
                            avatar TEXT,
                            about TEXT,
                            is_verified BOOLEAN DEFAULT false,
							verification_token TEXT,
							verification_expires TIMESTAMP,
                            password_reset_token TEXT,
                            password_reset_expires TIMESTAMP,
                            role role NOT NULL,
                            google_id INT,
                            facebook_id INT);

CREATE TABLE IF NOT EXISTS portfolio (id SERIAL PRIMARY KEY,
                            title VARCHAR NOT NULL UNIQUE,
                            description VARCHAR(2000) NOT NULL,
                            images TEXT[]   NOT NULL,
                            user_id INT REFERENCES users(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS category (id SERIAL PRIMARY KEY,
                                     title TEXT NOT NULL,
                                     sub_category TEXT NOT NULL UNIQUE);

CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY,
                                  title VARCHAR NOT NULL UNIQUE,
                                  place_of_service_provision varchar NOT NULL,
                                  description VARCHAR(2000) NOT NULL,
                                  initial_price INT NOT NULL,
                                  status order_status DEFAULT 'new',
                                  category_id INT NOT NULL REFERENCES category(id) ON DELETE CASCADE,
                                  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY,
                                  description VARCHAR(200) NOT NULL,
                                  price INT NOT NULL,
                                  deadline DATE NOT NULL,
                                  transaction_expres TIMESTAMP,
                                  status transaction_status DEFAULT 'new',
                                  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                                  freelancer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS reply (id SERIAL PRIMARY KEY,
                                  description VARCHAR(1000) NOT NULL,
                                  status reply_status DEFAULT 'new',
                                  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                                  freelancer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE);







