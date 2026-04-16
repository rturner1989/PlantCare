# frozen_string_literal: true

class AddUniqueIndexToRoomsNameUserId < ActiveRecord::Migration[8.1]
  # Expression index via raw SQL — add_index doesn't natively support
  # expression columns. Matches the model's
  # `uniqueness: { scope: :user_id, case_sensitive: false }` validation,
  # and closes the race where two concurrent creates could both pass the
  # validation before either committed.
  def up
    execute <<~SQL
      CREATE UNIQUE INDEX index_rooms_on_user_id_and_lower_name
        ON rooms (user_id, LOWER(name))
    SQL
  end

  def down
    execute 'DROP INDEX IF EXISTS index_rooms_on_user_id_and_lower_name'
  end
end
