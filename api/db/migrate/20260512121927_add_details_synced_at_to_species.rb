class AddDetailsSyncedAtToSpecies < ActiveRecord::Migration[8.1]
  def change
    add_column :species, :details_synced_at, :datetime
  end
end
