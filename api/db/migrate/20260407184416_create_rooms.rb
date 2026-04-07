class CreateRooms < ActiveRecord::Migration[8.1]
  def change
    create_table :rooms do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :icon

      t.timestamps
    end
  end
end
