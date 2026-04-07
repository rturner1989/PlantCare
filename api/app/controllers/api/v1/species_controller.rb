# frozen_string_literal: true

module Api
  module V1
    class SpeciesController < BaseController
      def index
        results = Species.search_with_api(params[:q])

        render json: results
      end

      def show
        species = if params[:perenual_id]
          Species.find_or_fetch_from_api(params[:perenual_id])
        else
          Species.find_by(id: params[:id])
        end

        return render json: { error: 'Not found' }, status: :not_found unless species

        render json: species
      end
    end
  end
end
