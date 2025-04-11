<?php

namespace App\Http\Controllers\API;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
class TicketController extends Controller
{
    public function index()
    {
        $tickets = Ticket::all();
        return response()->json(['data' => $tickets], 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'status' => 'sometimes|in:open,inprogress,closed',
            'attachment' => 'nullable|file|mimes:jpg,jpeg,png,webp,svg,mp4,mov,avi,mkv,webm|mimetypes:video/*,image/*|max:51200',
            'assignee' => 'nullable|string',
            'representer_name' => 'required|string|max:255',
            'representer_email' => 'required|email|max:255',
            'representer_phone' => 'required|string|max:20',
            'eta' => 'nullable|date',
            'client_id' => 'required|integer',
        ]);
    
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
    
        $data = $validator->validated();
    
        // Handle file upload
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('ticket_attachments', 'public');
            $data['attachment'] = $path;
        }
    
        $ticket = Ticket::create($data);
    
        return response()->json(['data' => $ticket], 201);
    }
    
    public function update(Request $request, $id)
    {
    Log::info('Raw input data:', $request->all()); // Add this for debugging

    
        // $ticket = Ticket::find($id);
        $ticket = Ticket::find($id);
        
        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }
    
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'status' => 'sometimes|in:open,inprogress,closed',
            'attachment' => 'nullable|file|mimes:jpg,jpeg,png,webp,svg,mp4,mov,avi,mkv,webm|mimetypes:video/*,image/*|max:51200',
            'assignee' => 'nullable|string',
            'representer_name' => 'sometimes|string|max:255',
            'representer_email' => 'sometimes|email|max:255',
            'representer_phone' => 'sometimes|string|max:20',
            'eta' => 'nullable|date',
            'client_id' => 'sometimes|integer',
        ]);
    
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
    
        $data = $validator->validated();
    
        // Handle file upload
        if ($request->hasFile('attachment')) {
            // Delete old attachment if exists
            if ($ticket->attachment) {
                Storage::disk('public')->delete($ticket->attachment);
            }
            
            $path = $request->file('attachment')->store('ticket_attachments', 'public');
            $data['attachment'] = $path;
        } elseif (array_key_exists('attachment', $data) && $data['attachment'] === null) {
            // Handle attachment removal when null is sent
            if ($ticket->attachment) {
                Storage::disk('public')->delete($ticket->attachment);
            }
            $data['attachment'] = null;
        } else {
            // Keep existing attachment if not being updated
            unset($data['attachment']);
        }
    
        $ticket->update($data);
    
        return response()->json(['data' => $ticket], 200);
    }

    public function show($id)
    {
        $ticket = Ticket::find($id);
        
        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        return response()->json(['data' => $ticket], 200);
    }

    public function destroy($id)
    {
        $ticket = Ticket::find($id);
        
        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $ticket->delete();

        return response()->json(['message' => 'Ticket deleted successfully'], 200);
    }
}