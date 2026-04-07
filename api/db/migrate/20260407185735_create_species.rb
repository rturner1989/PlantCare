class CreateSpecies < ActiveRecord::Migration[8.1]
  def change
    create_table :species do |t|
      t.string :common_name, null: false
      t.string :scientific_name
      t.integer :watering_frequency_days, null: false
      t.integer :feeding_frequency_days
      t.string :light_requirement
      t.string :humidity_preference
      t.decimal :temperature_min, precision: 4, scale: 1
      t.decimal :temperature_max, precision: 4, scale: 1
      t.string :toxicity
      t.string :difficulty
      t.string :growth_rate
      t.string :personality, null: false, default: 'chill'
      t.text :description
      t.text :care_tips
      t.string :image_url
      t.string :source, null: false, default: 'seed'
      t.string :external_id

      t.timestamps
    end

    add_index :species, :common_name
    add_index :species, :scientific_name
    add_index :species, [:source, :external_id], unique: true, where: 'external_id IS NOT NULL'
  end
end
