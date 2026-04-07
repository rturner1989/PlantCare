# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_07_205315) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pg_trgm"

  create_table "plants", force: :cascade do |t|
    t.date "acquired_at"
    t.integer "calculated_feeding_days"
    t.integer "calculated_watering_days"
    t.datetime "created_at", null: false
    t.string "humidity_level", default: "average", null: false
    t.datetime "last_fed_at"
    t.datetime "last_watered_at"
    t.string "light_level", default: "medium", null: false
    t.string "nickname", null: false
    t.text "notes"
    t.bigint "room_id", null: false
    t.bigint "species_id"
    t.string "temperature_level", default: "average", null: false
    t.datetime "updated_at", null: false
    t.index ["room_id"], name: "index_plants_on_room_id"
    t.index ["species_id"], name: "index_plants_on_species_id"
  end

  create_table "refresh_tokens", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.datetime "revoked_at"
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["token_digest"], name: "index_refresh_tokens_on_token_digest", unique: true
    t.index ["user_id"], name: "index_refresh_tokens_on_user_id"
  end

  create_table "rooms", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "icon"
    t.string "name", null: false
    t.integer "plants_count", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_rooms_on_user_id"
  end

  create_table "species", force: :cascade do |t|
    t.text "care_tips"
    t.string "common_name", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.string "difficulty"
    t.string "external_id"
    t.integer "feeding_frequency_days"
    t.string "growth_rate"
    t.string "humidity_preference"
    t.string "image_url"
    t.string "light_requirement"
    t.string "personality", default: "chill", null: false
    t.string "scientific_name"
    t.string "source", default: "seed", null: false
    t.decimal "temperature_max", precision: 4, scale: 1
    t.decimal "temperature_min", precision: 4, scale: 1
    t.string "toxicity"
    t.datetime "updated_at", null: false
    t.integer "watering_frequency_days", null: false
    t.index ["common_name"], name: "index_species_on_common_name"
    t.index ["scientific_name"], name: "index_species_on_scientific_name"
    t.index ["source", "external_id"], name: "index_species_on_source_and_external_id", unique: true, where: "(external_id IS NOT NULL)"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.string "timezone", default: "UTC"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "plants", "rooms"
  add_foreign_key "plants", "species"
  add_foreign_key "refresh_tokens", "users"
  add_foreign_key "rooms", "users"
end
