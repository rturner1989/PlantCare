class CreateCareLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :care_logs do |t|
      t.references :plant, null: false, foreign_key: true
      t.string :care_type, null: false
      t.datetime :performed_at, null: false
      t.string :notes

      t.timestamps
    end

    add_index :care_logs, [:plant_id, :performed_at]
  end
end
