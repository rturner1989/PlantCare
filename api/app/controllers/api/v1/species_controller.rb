# frozen_string_literal: true

module Api
  module V1
    class SpeciesController < BaseController
      def index
        if params[:q].present?
          render json: Species.search_with_api(params[:q])
        else
          render json: popular_species_payload
        end
      end

      def show
        species = if params[:perenual_id]
          Species.find_or_fetch_from_api(params[:perenual_id], fallback: fallback_params)
        else
          Species.find_by(id: params[:id])
        end

        return render json: { error: 'Not found' }, status: :not_found unless species

        render json: species
      end

      private def fallback_params
        {
          common_name: params[:common_name],
          scientific_name: params[:scientific_name],
          image_url: params[:image_url]
        }
      end

      private def popular_species_payload
        Rails.cache.fetch('species:popular:v1', expires_in: 1.hour) do
          Species.popular.order(:common_name).limit(10).as_json
        end
      end
    end
  end
end
