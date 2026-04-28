# frozen_string_literal: true

class AddArchivedAtToSpaces < ActiveRecord::Migration[8.1]
  def change
    add_column :spaces, :archived_at, :datetime
    add_index :spaces, [:user_id, :archived_at]
  end
end
