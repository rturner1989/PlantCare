# frozen_string_literal: true

module Api
  module V1
    class SpeciesController < BaseController
      def index
        if params[:q].present?
          render json: Species.search_with_api(params[:q])
        else
          render json: Species.popular_payload
        end
      end

      def show
        species = if params[:perenual_id]
          Species.find_or_fetch_from_api(params[:perenual_id], fallback: search_summary)
        else
          Species.find_by(id: params[:id])
        end

        return render json: { error: 'Not found' }, status: :not_found unless species

        render json: species
      end

      private def search_summary
        {
          common_name: params[:common_name],
          scientific_name: params[:scientific_name],
          image_url: params[:image_url]
        }
      end
    end
  end
end
