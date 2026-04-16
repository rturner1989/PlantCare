# frozen_string_literal: true

class AddPopularToSpecies < ActiveRecord::Migration[8.1]
  def change
    add_column :species, :popular, :boolean, default: false, null: false
    add_index :species, :popular, where: 'popular = true'
  end
end
