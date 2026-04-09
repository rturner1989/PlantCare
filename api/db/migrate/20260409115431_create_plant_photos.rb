class CreatePlantPhotos < ActiveRecord::Migration[8.1]
  def change
    create_table :plant_photos do |t|
      t.references :plant, null: false, foreign_key: true
      t.string :caption
      t.datetime :taken_at, null: false

      t.timestamps
    end

    add_index :plant_photos, [:plant_id, :taken_at]
  end
end
