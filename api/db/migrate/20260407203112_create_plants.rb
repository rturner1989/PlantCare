class CreatePlants < ActiveRecord::Migration[8.1]
  def change
    create_table :plants do |t|
      t.references :room, null: false, foreign_key: true
      t.references :species, foreign_key: true
      t.string :nickname, null: false
      t.text :notes
      t.string :light_level, null: false, default: 'medium'
      t.string :temperature_level, null: false, default: 'average'
      t.string :humidity_level, null: false, default: 'average'
      t.integer :calculated_watering_days
      t.integer :calculated_feeding_days
      t.datetime :last_watered_at
      t.datetime :last_fed_at
      t.date :acquired_at

      t.timestamps
    end
  end
end
