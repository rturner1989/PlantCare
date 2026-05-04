class AddCachedAggregatesToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :plants_count, :integer, null: false, default: 0
    add_column :users, :care_logs_count, :integer, null: false, default: 0
    add_column :users, :current_streak_days, :integer, null: false, default: 0
    add_column :users, :longest_streak_days, :integer, null: false, default: 0
    add_column :users, :last_care_logged_on, :date

    # Backfill existing data so the cached counters match reality before
    # callbacks take over.
    reversible do |direction|
      direction.up do
        execute(<<~SQL.squish)
          UPDATE users SET plants_count = (
            SELECT COUNT(*) FROM plants
            INNER JOIN spaces ON spaces.id = plants.space_id
            WHERE spaces.user_id = users.id
          )
        SQL
        execute(<<~SQL.squish)
          UPDATE users SET care_logs_count = (
            SELECT COUNT(*) FROM care_logs
            INNER JOIN plants ON plants.id = care_logs.plant_id
            INNER JOIN spaces ON spaces.id = plants.space_id
            WHERE spaces.user_id = users.id
          )
        SQL
      end
    end
  end
end
