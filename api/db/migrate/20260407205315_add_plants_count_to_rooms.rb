class AddPlantsCountToRooms < ActiveRecord::Migration[8.1]
  def change
    add_column :rooms, :plants_count, :integer, default: 0, null: false

    Room.reset_column_information
    Room.find_each do |room|
      Room.update_counters(room.id, plants_count: room.plants.count)
    end
  end
end
