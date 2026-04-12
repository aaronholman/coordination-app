import { createClient } from '@/lib/supabase/server';
import { seedProjects, seedTasks, seedDocuments, seedRecommendations, seedRecipes } from '@/lib/seed-data';
import { NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function POST() {
  try {
    const supabase = await createClient() as AnyClient;

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if ((profile as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Check if data already exists
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('created_by', user.id)
      .limit(1);

    if (existingProjects && existingProjects.length > 0) {
      return NextResponse.json(
        { error: 'Data already seeded for this user' },
        { status: 400 }
      );
    }

    const inserted = {
      projects: 0,
      tasks: 0,
      documents: 0,
      recommendations: 0,
      recipes: 0,
    };

    // Insert projects
    if (seedProjects.length > 0) {
      const projectsToInsert = seedProjects.map((p) => ({
        ...p,
        created_by: user.id,
      }));

      const { data: insertedProjects, error: projectError } = await supabase
        .from('projects')
        .insert(projectsToInsert)
        .select('id, name');

      if (projectError) {
        console.error('Error inserting projects:', projectError);
        return NextResponse.json(
          { error: 'Failed to insert projects' },
          { status: 500 }
        );
      }

      inserted.projects = insertedProjects?.length || 0;

      // Create a map of project names to IDs
      const projectMap = new Map<string, string>();
      insertedProjects?.forEach((p: any) => {
        projectMap.set(p.name, p.id);
      });

      // Insert tasks
      if (seedTasks.length > 0) {
        const tasksToInsert = seedTasks.map((t) => {
          let projectId: string | null = null;
          if (t.project) {
            projectId = projectMap.get(t.project) || null;
          }

          // Store person names in description if assigned_to is not available
          let description: string | null = null;
          if (t.person) {
            description = `Assigned to: ${t.person}`;
          }

          return {
            title: t.title,
            description,
            status: t.status,
            due_date: t.due_date || null,
            project_id: projectId,
            assigned_to: null,
            created_by: user.id,
          };
        });

        const { data: insertedTasks, error: taskError } = await supabase
          .from('tasks')
          .insert(tasksToInsert)
          .select('id');

        if (taskError) {
          console.error('Error inserting tasks:', taskError);
          return NextResponse.json(
            { error: 'Failed to insert tasks' },
            { status: 500 }
          );
        }

        inserted.tasks = insertedTasks?.length || 0;
      }

      // Insert documents
      if (seedDocuments.length > 0) {
        const docsToInsert = seedDocuments.map((d: any) => {
          let projectId: string | null = null;
          if (d.project) {
            projectId = projectMap.get(d.project) || null;
          }

          return {
            name: d.name,
            tags: d.tags || null,
            project_id: projectId,
            created_by: user.id,
          };
        });

        const { data: insertedDocs, error: docError } = await supabase
          .from('documents')
          .insert(docsToInsert)
          .select('id');

        if (docError) {
          console.error('Error inserting documents:', docError);
          return NextResponse.json(
            { error: 'Failed to insert documents' },
            { status: 500 }
          );
        }

        inserted.documents = insertedDocs?.length || 0;
      }

      // Insert recommendations
      if (seedRecommendations.length > 0) {
        const recsToInsert = seedRecommendations.map((r: any) => ({
          name: r.name,
          type: r.type,
          description: r.description || null,
          origin: r.origin || null,
          created_by: user.id,
        }));

        const { data: insertedRecs, error: recError } = await supabase
          .from('recommendations')
          .insert(recsToInsert)
          .select('id');

        if (recError) {
          console.error('Error inserting recommendations:', recError);
          return NextResponse.json(
            { error: 'Failed to insert recommendations' },
            { status: 500 }
          );
        }

        inserted.recommendations = insertedRecs?.length || 0;
      }

      // Insert recipes
      if (seedRecipes.length > 0) {
        const recipesToInsert = seedRecipes.map((r: any) => ({
          name: r.name,
          url: r.url || null,
          tags: r.tags || null,
          created_by: user.id,
        }));

        const { data: insertedRecipes, error: recipeError } = await supabase
          .from('recipes')
          .insert(recipesToInsert)
          .select('id');

        if (recipeError) {
          console.error('Error inserting recipes:', recipeError);
          return NextResponse.json(
            { error: 'Failed to insert recipes' },
            { status: 500 }
          );
        }

        inserted.recipes = insertedRecipes?.length || 0;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      inserted,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
