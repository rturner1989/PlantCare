# frozen_string_literal: true

class RenameRoomsToSpaces < ActiveRecord::Migration[8.1]
  def up
    rename_table :rooms, :spaces
    rename_column :plants, :room_id, :space_id

    # rename_table only renames indexes whose name matches the
    # auto-generated `index_<table>_on_<column>` convention. The
    # expression index from 20260416131121 was created via raw SQL
    # so Rails doesn't recognise it as renameable — handle by hand.
    execute 'ALTER INDEX index_rooms_on_user_id_and_lower_name RENAME TO index_spaces_on_user_id_and_lower_name'
  end

  def down
    execute 'ALTER INDEX index_spaces_on_user_id_and_lower_name RENAME TO index_rooms_on_user_id_and_lower_name'
    rename_column :plants, :space_id, :room_id
    rename_table :spaces, :rooms
  end
end
