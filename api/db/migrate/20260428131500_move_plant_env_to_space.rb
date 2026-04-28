class MovePlantEnvToSpace < ActiveRecord::Migration[8.1]
  def up
    add_column :spaces, :light_level, :string, default: 'medium', null: false
    add_column :spaces, :temperature_level, :string, default: 'average', null: false
    add_column :spaces, :humidity_level, :string, default: 'average', null: false

    # Backfill: take the first plant's env per space (deterministic via id).
    # Pre-launch, so flattening any per-plant variation within a space is
    # acceptable — the new model is "plants inherit from space".
    execute <<~SQL.squish
      UPDATE spaces
      SET light_level = sub.light_level,
          temperature_level = sub.temperature_level,
          humidity_level = sub.humidity_level
      FROM (
        SELECT DISTINCT ON (space_id) space_id, light_level, temperature_level, humidity_level
        FROM plants
        ORDER BY space_id, id ASC
      ) sub
      WHERE spaces.id = sub.space_id
    SQL

    remove_column :plants, :light_level
    remove_column :plants, :temperature_level
    remove_column :plants, :humidity_level
  end

  def down
    add_column :plants, :light_level, :string, default: 'medium', null: false
    add_column :plants, :temperature_level, :string, default: 'average', null: false
    add_column :plants, :humidity_level, :string, default: 'average', null: false

    execute <<~SQL.squish
      UPDATE plants
      SET light_level = spaces.light_level,
          temperature_level = spaces.temperature_level,
          humidity_level = spaces.humidity_level
      FROM spaces
      WHERE plants.space_id = spaces.id
    SQL

    remove_column :spaces, :light_level
    remove_column :spaces, :temperature_level
    remove_column :spaces, :humidity_level
  end
end
